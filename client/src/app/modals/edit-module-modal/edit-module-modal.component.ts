import { Component, Input, OnInit, ViewChild, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Module } from '../../_models/module';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { ConfirmCloseModalComponent } from '../confirm-close-modal/confirm-close-modal.component';

@Component({
  selector: 'app-edit-module-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-module-modal.component.html',
  styleUrls: ['./edit-module-modal.component.css']
})
export class EditModuleModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() module!: Module;
  @Input() bsModalRef!: BsModalRef<EditModuleModalComponent>;

  @ViewChild('editForm') editForm?: NgForm;

  baseUrl = environment.apiUrl;

  newCode = '';
  newName = '';
  // '1' | '2' | 'year' → allow choosing Semester 1, Semester 2, or Year module
  semesterChoice: '1' | '2' | 'year' = '1';

  private originalHide!: () => void;
  private justSaved = false;

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
    this.newCode = this.module.moduleCode;
    this.newName = this.module.moduleName;

    // Initialise semester choice from current module state
    if (this.module.isYearModule) {
      this.semesterChoice = 'year';
    } else {
      this.semesterChoice = this.module.semester === 2 ? '2' : '1';
    }

    const ref = this.bsModalRef ?? this.modalRef;
    this.originalHide = ref.hide.bind(ref);
    ref.hide = () => this.attemptClose();
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

  private hasUnsavedChanges(): boolean {
    if (this.justSaved) return false;
    return !!this.editForm?.dirty;
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

  submit() {
    const payload: any = {
      moduleCode: this.newCode,
      moduleName: this.newName
    };

    if (this.semesterChoice === 'year') {
      // Turn into (or keep as) a Year module
      payload.isYearModule = true;
      // No need to send semester; backend already treats IsYearModule as authoritative
    } else {
      // Normal semester module
      payload.isYearModule = false;
      payload.semester = Number(this.semesterChoice);
    }

    this.http.put(`${this.baseUrl}modules/${this.module.id}`, payload).subscribe({
      next: () => {
        this.toastr.success('Module updated successfully');
        this.justSaved = true;
        this.originalHide();
      },
      error: err => {
        this.toastr.error('Failed to update module');
        console.error(err);
      }
    });
  }

  cancel() { this.attemptClose(); }
}
