import { Component, AfterViewInit, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { ConfirmCloseModalComponent } from '../confirm-close-modal/confirm-close-modal.component';
import { AssessmentSchedule } from '../../_models/assessment-schedule';

type Assessment = Pick<
  AssessmentSchedule,
  'title' | 'date' | 'isTimed' | 'startTime' | 'endTime' | 'dueTime' | 'venue'
> & { description?: string }; // ✅ include description

@Component({
  selector: 'app-add-module-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-module-modal.component.html',
  styleUrls: ['./add-module-modal.component.css']
})
export class AddModuleModalComponent implements AfterViewInit, OnDestroy {
  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    public modalRef: BsModalRef,
    private bsModalService: BsModalService,
    private elRef: ElementRef<HTMLElement>
  ) {
    this.originalHide = this.modalRef.hide.bind(this.modalRef);
    this.modalRef.hide = () => this.attemptClose();
  }

  baseUrl = environment.apiUrl;

  @ViewChild('moduleCodeInput') moduleCodeInput!: ElementRef<HTMLInputElement>;

  moduleCode = '';
  moduleName = '';
  semesterChoice: '1' | '2' | 'year' = '1';

  classVenue = '';
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  selectedDays: { [key: string]: boolean } = {};
  startTimes: { [key: string]: string } = {};
  endTimes: { [key: string]: string } = {};

  assessments: Assessment[] = [];

  private formDirty = false;
  private originalHide!: () => void;

  private modalEl: HTMLElement | null = null;
  private backdropCapture?: (ev: MouseEvent) => void;
  private escCapture?: (ev: KeyboardEvent) => void;

  /** Convenience getter: core validity for required fields only (code, name, semester) */
  get isCoreValid(): boolean {
    const code = (this.moduleCode || '').trim();
    const name = (this.moduleName || '').trim();
    const semValid = ['1', '2', 'year'].includes(this.semesterChoice);
    return code.length > 0 && name.length > 0 && semValid;
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.moduleCodeInput?.nativeElement.focus(), 0);

    const contentEl = this.elRef.nativeElement.closest('.modal-content') as HTMLElement | null;
    const modalEl = contentEl?.closest('.modal') as HTMLElement | null;
    this.modalEl = modalEl;

    if (modalEl) {
      this.backdropCapture = (ev: MouseEvent) => {
        const t = ev.target as Element;
        const inside = t.closest('.modal') === modalEl;
        const inDialog = !!t.closest('.modal-dialog');
        if (inside && !inDialog && this.formDirty) {
          ev.stopPropagation(); ev.preventDefault();
          this.openConfirm().then(discard => { if (discard) this.originalHide(); });
        }
      };
      modalEl.addEventListener('mousedown', this.backdropCapture, true);
    }

    this.escCapture = (ev: KeyboardEvent) => {
      if ((ev.key === 'Escape' || ev.key === 'Esc') && this.formDirty) {
        ev.stopPropagation(); ev.preventDefault();
        this.openConfirm().then(discard => { if (discard) this.originalHide(); });
      }
    };
    document.addEventListener('keydown', this.escCapture, true);
  }

  ngOnDestroy(): void {
    if (this.modalEl && this.backdropCapture) this.modalEl.removeEventListener('mousedown', this.backdropCapture, true);
    if (this.escCapture) document.removeEventListener('keydown', this.escCapture, true);
  }

  markDirty(): void { this.formDirty = true; }

  private formatTimeString(time: string): string | null {
    if (!time) return null;
    return time.length === 5 ? time + ':00' : time;
  }

  addAssessment(): void {
    this.assessments.push({
      title: '',
      description: '', // ✅ default
      date: '',
      isTimed: true,
      startTime: '',
      endTime: '',
      venue: ''
    });
    this.markDirty();
  }

  removeAssessment(index: number): void {
    this.assessments.splice(index, 1);
    this.markDirty();
  }

  private isAssessmentValid(a: Assessment): boolean {
    if (!a) return false;
    const hasTitle = (a.title || '').trim().length > 0;
    const hasDesc = (a.description || '').trim().length > 0; // ✅ required (unchanged rule you already had)
    const hasDate = (a.date || '').trim().length > 0;

    if (!hasTitle || !hasDesc || !hasDate) return false;

    if (a.isTimed) {
      const v = (a.venue || '').trim();
      const st = (a.startTime || '').trim();
      const et = (a.endTime || '').trim();
      return v.length > 0 && st.length > 0 && et.length > 0;
    } else {
      const due = (a.dueTime || '').trim();
      return due.length > 0;
    }
  }

  /** Validate only the must-have inputs and show actionable errors */
  private validateCoreFields(): boolean {
    const errors: string[] = [];
    const code = (this.moduleCode || '').trim();
    const name = (this.moduleName || '').trim();
    const semValid = ['1', '2', 'year'].includes(this.semesterChoice);

    if (code.length === 0) errors.push('Module Code is required.');
    if (name.length === 0) errors.push('Module Name is required.');
    if (!semValid) errors.push('Please select a valid Semester.');

    if (errors.length) {
      this.toastr.error(errors.join(' '));
      // Focus first missing field for a nicer UX
      if (code.length === 0 && this.moduleCodeInput) {
        setTimeout(() => this.moduleCodeInput.nativeElement.focus(), 0);
      }
      return false;
    }
    return true;
  }

  submit(): void {
    // ✅ Enforce only the three required fields
    if (!this.validateCoreFields()) return;

    // Existing assessment validation remains unchanged
    const anyInvalid = this.assessments.some(a => !this.isAssessmentValid(a));
    if (anyInvalid) {
      this.toastr.error('Please complete Title, Description, Date and the required time fields for each assessment.');
      return;
    }

    const chosenDays: string[] = [];
    const starts: string[] = [];
    const ends: string[] = [];

    for (const day of this.weekDays) {
      if (this.selectedDays[day]) {
        chosenDays.push(day);
        starts.push(this.startTimes[day] || '');
        ends.push(this.endTimes[day] || '');
      }
    }

    const cleanedAssessments = this.assessments.filter(a => (a.date || '').trim() !== '');
    const processedAssessments = cleanedAssessments.map(a => ({
      title: (a.title || '').trim(),
      description: ((a.description || '').trim() || null),
      date: a.date,
      isTimed: a.isTimed,
      startTime: a.isTimed ? this.formatTimeString(a.startTime || '') : null,
      endTime: a.isTimed ? this.formatTimeString(a.endTime || '') : null,
      dueTime: a.isTimed ? null : this.formatTimeString(a.dueTime || ''),
      venue: a.isTimed ? (a.venue || '') : null
    }));

    const isYear = this.semesterChoice === 'year';
    const semesterNumber = isYear ? 1 : Number(this.semesterChoice);

    const payload = {
      moduleCode: (this.moduleCode || '').trim(),
      moduleName: (this.moduleName || '').trim(),
      semester: semesterNumber,
      isYearModule: isYear,
      classVenue: (this.classVenue || '').trim() || null,
      weekDays: chosenDays,
      startTimes: starts,
      endTimes: ends,
      assessments: processedAssessments
    };

    this.http.post(this.baseUrl + 'modules', payload).subscribe({
      next: () => {
        this.toastr.success('Module added successfully');
        this.formDirty = false;
        this.originalHide();
      },
      error: err => {
        this.toastr.error('Failed to add module');
        console.error(err);
      }
    });
  }

  private openConfirm(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.bsModalService.show(ConfirmCloseModalComponent, {
        class: 'modal-dialog-centered',
        initialState: { onStay: () => resolve(false), onDiscard: () => resolve(true) }
      });
    });
  }

  private attemptClose(): void {
    if (!this.formDirty) {
      this.originalHide();
      return;
    }
    this.openConfirm().then(discard => { if (discard) this.originalHide(); });
  }

  cancel(): void { this.attemptClose(); }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: BeforeUnloadEvent) {
    if (this.formDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
