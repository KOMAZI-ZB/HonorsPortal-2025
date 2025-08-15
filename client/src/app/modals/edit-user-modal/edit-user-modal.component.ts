import { Component, Input, OnInit, ViewChild, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { User } from '../../_models/user';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmCloseModalComponent } from '../confirm-close-modal/confirm-close-modal.component';

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user-modal.component.html',
  styleUrls: ['./edit-user-modal.component.css']
})
export class EditUserModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() user!: User;
  @Input() bsModalRef!: BsModalRef<EditUserModalComponent>;

  @ViewChild('userForm') userForm?: NgForm;

  roles = ['Admin', 'Student', 'Lecturer', 'Coordinator'];
  selectedRoles: string[] = [];

  firstName = '';
  lastName = '';
  email = '';
  updatePassword = '';
  showPassword = false;

  baseUrl = environment.apiUrl;

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
    this.firstName = this.user.name;
    this.lastName = this.user.surname;
    this.email = this.user.email;
    this.selectedRoles = [...this.user.roles];

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
    return !!this.userForm?.dirty;
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

  toggleRole(role: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedRoles.includes(role)) this.selectedRoles.push(role);
    } else {
      this.selectedRoles = this.selectedRoles.filter(r => r !== role);
    }
  }

  togglePasswordVisibility() { this.showPassword = !this.showPassword; }

  submit() {
    const payload = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      updatePassword: this.updatePassword || null,
      roles: this.selectedRoles
    };

    this.http.put(`${this.baseUrl}admin/update-user/${this.user.userName}`, payload).subscribe({
      next: () => { this.toastr.success('User updated successfully'); this.justSaved = true; this.originalHide(); },
      error: err => {
        console.error('Update failed:', err);
        const message = err.error?.message || 'Failed to update user';
        this.toastr.error(message);
      }
    });
  }

  cancel() { this.attemptClose(); }
}
