import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AnnouncementService } from '../../_services/announcement.service';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../../_services/account.service';
import { CommonModule } from '@angular/common';
import { ConfirmCloseModalComponent } from '../confirm-close-modal/confirm-close-modal.component';

@Component({
  selector: 'app-create-announcement-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-announcement-modal.component.html',
  styleUrls: ['./create-announcement-modal.component.css']
})
export class CreateAnnouncementModalComponent implements OnInit, AfterViewInit, OnDestroy {
  form!: FormGroup;
  imageFile?: File;
  currentUserRole: string = '';

  private originalHide!: () => void;
  private justSaved = false;

  private modalEl: HTMLElement | null = null;
  private backdropCapture?: (ev: MouseEvent) => void;
  private escCapture?: (ev: KeyboardEvent) => void;

  constructor(
    public bsModalRef: BsModalRef<CreateAnnouncementModalComponent>,
    private fb: FormBuilder,
    private announcementService: AnnouncementService,
    private toastr: ToastrService,
    private accountService: AccountService,
    private bsModalService: BsModalService,
    private elRef: ElementRef<HTMLElement>
  ) { }

  ngOnInit(): void {
    this.currentUserRole = this.accountService.getUserRole();
    this.initForm();

    this.originalHide = this.bsModalRef.hide.bind(this.bsModalRef);
    this.bsModalRef.hide = () => this.attemptClose();
    this.justSaved = false;
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

  initForm() {
    this.form = this.fb.group({
      type: ['General', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(5)]],
      moduleId: [null],
      image: [null]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.imageFile = file;
  }

  private hasUnsavedChanges(): boolean {
    if (this.justSaved) return false;
    return this.form?.dirty || !!this.imageFile;
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
    if (this.form.invalid) {
      this.toastr.error('Please complete all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('type', this.form.get('type')?.value);
    formData.append('title', this.form.get('title')?.value);
    formData.append('message', this.form.get('message')?.value);
    if (this.form.get('moduleId')?.value)
      formData.append('moduleId', this.form.get('moduleId')?.value.toString());
    if (this.imageFile) formData.append('image', this.imageFile);

    this.announcementService.create(formData).subscribe({
      next: () => {
        this.toastr.success('Announcement posted');
        localStorage.setItem('newAnnouncement', 'true');

        // mark pristine and allow silent close
        this.justSaved = true;
        this.form.markAsPristine();
        this.originalHide();
      },
      error: err => {
        this.toastr.error('Failed to post announcement');
        console.error(err);
      }
    });
  }

  cancel() { this.attemptClose(); }
}
