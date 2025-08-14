import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AdminService } from '../../_services/admin.service';
import { ModuleService } from '../../_services/module.service';
import { Module } from '../../_models/module';
import { ToastrService } from 'ngx-toastr';
import { ConfirmCloseModalComponent } from '../confirm-close-modal/confirm-close-modal.component';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css']
})
export class AddUserModalComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private adminService: AdminService,
    private moduleService: ModuleService,
    private toastr: ToastrService,
    public modalRef: BsModalRef,
    private bsModalService: BsModalService,
    private elRef: ElementRef<HTMLElement>
  ) { }

  @ViewChild('usernameInput') usernameInput!: ElementRef<HTMLInputElement>;

  userNumber = '';
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  role = 'Student';
  showPassword = false;

  semester1Modules: Module[] = [];
  semester2Modules: Module[] = [];
  selectedSemester1: number[] = [];
  selectedSemester2: number[] = [];
  roles = ['Student', 'Lecturer', 'Coordinator', 'Admin'];

  // confirm-close state
  private originalHide!: () => void;
  private formDirty = false;

  private modalEl: HTMLElement | null = null;
  private backdropCapture?: (ev: MouseEvent) => void;
  private escCapture?: (ev: KeyboardEvent) => void;

  ngOnInit(): void {
    this.userNumber = '';
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.password = '';

    this.moduleService.getAllModules().subscribe({
      next: modules => {
        this.semester1Modules = modules.filter(m => m.semester === 1);
        this.semester2Modules = modules.filter(m => m.semester === 2);
      }
    });

    this.originalHide = this.modalRef.hide.bind(this.modalRef);
    this.modalRef.hide = () => this.attemptClose();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.usernameInput?.nativeElement.focus(), 0);

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

  // mark dirty on any edit
  markDirty() { this.formDirty = true; }

  toggleModule(id: number, list: number[], event: any) {
    if (event.target.checked) {
      if (!list.includes(id)) list.push(id);
    } else {
      const index = list.indexOf(id);
      if (index > -1) list.splice(index, 1);
    }
    this.formDirty = true;
  }

  togglePasswordVisibility() { this.showPassword = !this.showPassword; }

  private openConfirm(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.bsModalService.show(ConfirmCloseModalComponent, {
        class: 'modal-dialog-centered',
        initialState: { onStay: () => resolve(false), onDiscard: () => resolve(true) }
      });
    });
  }

  async attemptClose() {
    if (this.formDirty) {
      const discard = await this.openConfirm();
      if (!discard) return;
    }
    this.originalHide();
  }

  submit() {
    const payload = {
      userNumber: this.userNumber,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password || 'Pa$$w0rd',
      role: this.role,
      semester1ModuleIds: this.selectedSemester1,
      semester2ModuleIds: this.selectedSemester2
    };

    this.adminService.registerUser(payload).subscribe({
      next: (res: any) => {
        this.toastr.success(res?.message || 'User registered');
        this.formDirty = false;
        this.originalHide();
      },
      error: (err: any) => {
        const msg = err.error?.message || 'Failed to register user';
        this.toastr.error(msg);
      }
    });
  }

  cancel() { this.attemptClose(); }
}
