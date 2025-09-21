import { Component, Input, OnInit, ViewChild, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Module } from '../../_models/module';
import { ClassSession } from '../../_models/class-session';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { ConfirmCloseModalComponent } from '../confirm-close-modal/confirm-close-modal.component';

interface Assessment {
  title: string;
  description?: string;
  date: string;
  isTimed: boolean;
  startTime?: string;
  endTime?: string;
  dueTime?: string;
  venue?: string;
}

type DayState = { checked: boolean; startTime: string; endTime: string; };

interface VenueConfig {
  venue: string;
  days: { [day: string]: DayState };
}

@Component({
  selector: 'app-edit-details-modal',
  standalone: true,
  templateUrl: './edit-details-modal.component.html',
  styleUrls: ['./edit-details-modal.component.css'],
  imports: [CommonModule, FormsModule]
})
export class EditDetailsModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() module!: Module;
  @Input() bsModalRef!: BsModalRef<EditDetailsModalComponent>;

  @ViewChild('detailsForm') detailsForm?: NgForm;

  baseUrl = environment.apiUrl;

  // ✅ Weekends removed for class scheduling in the modal
  weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  venues: VenueConfig[] = [];
  assessments: Assessment[] = [];

  activeTab: 'contact' | 'assessments' = 'contact';
  setTab(t: 'contact' | 'assessments') { this.activeTab = t; }

  private originalHide!: () => void;
  private justSaved = false;
  private locallyDirty = false;

  private modalEl: HTMLElement | null = null;
  private backdropCapture?: (ev: MouseEvent) => void;
  private escCapture?: (ev: KeyboardEvent) => void;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    public modalRef: BsModalRef,
    private bsModalService: BsModalService,
    private elRef: ElementRef<HTMLElement>
  ) { }

  ngOnInit(): void {
    const ref = this.bsModalRef ?? this.modalRef;
    this.originalHide = ref.hide.bind(ref);
    ref.hide = () => this.attemptClose();

    this.http.get<Module>(`${this.baseUrl}modules/${this.module.id}`).subscribe({
      next: (updated) => {
        this.module = updated;

        const sessions = (updated.classSessions || []) as ClassSession[];
        const byVenue = new Map<string, VenueConfig>();

        const makeEmptyDays = (): { [d: string]: DayState } => {
          const obj: { [d: string]: DayState } = {};
          this.weekDays.forEach(d => obj[d] = { checked: false, startTime: '', endTime: '' });
          return obj;
        };

        for (const s of sessions) {
          // Ignore any legacy weekend data silently
          if (!this.weekDays.includes(s.weekDay)) continue;

          if (!byVenue.has(s.venue)) byVenue.set(s.venue, { venue: s.venue, days: makeEmptyDays() });
          const cfg = byVenue.get(s.venue)!;
          if (cfg.days[s.weekDay]) {
            cfg.days[s.weekDay].checked = true;
            cfg.days[s.weekDay].startTime = s.startTime?.length === 5 ? s.startTime + ':00' : (s.startTime || '');
            cfg.days[s.weekDay].endTime = s.endTime?.length === 5 ? s.endTime + ':00' : (s.endTime || '');
          }
        }

        this.venues = Array.from(byVenue.values());
        if (this.venues.length === 0) this.addVenue();

        this.assessments = (updated.assessments || []).map(a => ({
          title: a.title,
          description: (a as any).description || '',
          date: a.date,
          isTimed: a.isTimed,
          startTime: a.startTime || '',
          endTime: a.endTime || '',
          dueTime: a.dueTime || '',
          venue: a.venue || ''
        }));

        this.justSaved = false;
        this.locallyDirty = false;
        setTimeout(() => this.detailsForm?.form.markAsPristine());
      },
      error: (err) => {
        console.error('❌ Failed to fetch module data:', err);
        this.addVenue();
        this.assessments = [];
      }
    });
  }

  ngAfterViewInit(): void {
    const contentEl = this.elRef.nativeElement.closest('.modal-content') as HTMLElement | null;
    const modalEl = contentEl?.closest('.modal') as HTMLElement | null;
    this.modalEl = modalEl;

    if (modalEl) {
      this.backdropCapture = (ev: MouseEvent) => {
        const t = ev.target as Element;
        const insideThisModal = t.closest('.modal') === modalEl;
        const inDialog = !!t.closest('.modal-dialog');
        if (insideThisModal && !inDialog && this.hasUnsavedChanges()) {
          ev.stopPropagation(); ev.preventDefault();
          this.openConfirm().then(discard => { if (discard) this.originalHide(); });
        }
      };
      modalEl.addEventListener('mousedown', this.backdropCapture, true);
    }

    this.escCapture = (ev: KeyboardEvent) => {
      if ((ev.key === 'Escape' || ev.key === 'Esc') && this.hasUnsavedChanges()) {
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

  // public for template
  markDirty() { this.locallyDirty = true; }

  private formatTimeString(time: string): string | null {
    if (!time) return null;
    return time.length === 5 ? time + ':00' : time;
  }

  addVenue(): void {
    const days: { [d: string]: DayState } = {};
    this.weekDays.forEach(d => days[d] = { checked: false, startTime: '', endTime: '' });
    this.venues.push({ venue: '', days });
    this.markDirty();
  }

  removeVenue(index: number): void {
    this.venues.splice(index, 1);
    if (this.venues.length === 0) this.addVenue();
    this.markDirty();
  }

  toggleDay(vIndex: number, day: string): void {
    const state = this.venues[vIndex].days[day];
    state.checked = !state.checked;
    if (!state.checked) { state.startTime = ''; state.endTime = ''; }
    this.markDirty();
  }

  addAssessment() {
    this.assessments.push({ title: '', description: '', date: '', isTimed: true, startTime: '', endTime: '', venue: '' });
    this.markDirty();
  }

  removeAssessment(index: number) { this.assessments.splice(index, 1); this.markDirty(); }

  private hasUnsavedChanges(): boolean {
    if (this.justSaved) return false;
    return !!this.detailsForm?.dirty || this.locallyDirty;
  }

  private openConfirm(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.bsModalService.show(ConfirmCloseModalComponent, {
        class: 'modal-dialog-centered',
        initialState: { onStay: () => resolve(false), onDiscard: () => resolve(true) }
      });
    });
  }

  async attemptClose() {
    if (this.hasUnsavedChanges()) {
      const discard = await this.openConfirm();
      if (!discard) return;
    }
    this.originalHide();
  }

  // ✅ Validation rule: require title, description, date; then timed vs non-timed fields
  private isAssessmentValid(a: Assessment): boolean {
    if (!a) return false;
    const hasTitle = (a.title || '').trim().length > 0;
    const hasDesc = (a.description || '').trim().length > 0; // required
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

  submit() {
    // Block submit if any assessment is incomplete
    const anyInvalid = this.assessments.some(a => !this.isAssessmentValid(a));
    if (anyInvalid) {
      this.activeTab = 'assessments';
      this.toastr.error('Please complete Title, Description, Date and the required time fields for each assessment before saving.');
      return;
    }

    const classSessions: ClassSession[] = [];

    for (const v of this.venues) {
      const venueName = (v.venue || '').trim();
      if (!venueName) continue;

      // ✅ Only Monday–Friday are iterated
      for (const day of this.weekDays) {
        const st = v.days[day];
        if (!st.checked) continue;
        const start = this.formatTimeString(st.startTime) || '';
        const end = this.formatTimeString(st.endTime) || '';
        if (!start || !end) continue;

        classSessions.push({ venue: venueName, weekDay: day, startTime: start, endTime: end });
      }
    }

    const cleanedAssessments = this.assessments.filter(a => (a.date || '').trim() !== '');
    const processedAssessments = cleanedAssessments.map(a => ({
      title: a.title,
      description: (a.description || '').trim() || null,
      date: a.date,
      isTimed: a.isTimed,
      startTime: a.isTimed ? this.formatTimeString(a.startTime!) : null,
      endTime: a.isTimed ? this.formatTimeString(a.endTime!) : null,
      dueTime: a.isTimed ? null : this.formatTimeString(a.dueTime!),
      venue: a.isTimed ? a.venue : null
    }));

    const payload: any = { classSessions, assessments: processedAssessments };

    this.http.put<any>(`${this.baseUrl}modules/${this.module.id}`, payload).subscribe({
      next: response => {
        this.toastr.success('Module details updated');
        if (response.notification) {
          this.toastr.info(`An notification was triggered for ${this.module.moduleCode}`, 'Schedule Updated');
          console.log('🔔 Notification:', response.notification);
        }
        this.justSaved = true;
        this.originalHide();
      },
      error: err => { this.toastr.error('Failed to update module'); console.error(err); }
    });
  }

  cancel() { this.attemptClose(); }
}
