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

  userName = '';
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  role = 'Student';
  showPassword = false;

  semester1Modules: Module[] = [];
  semester2Modules: Module[] = [];

  // Selected IDs
  selectedSemester1: number[] = [];
  selectedSemester2: number[] = [];

  // Track which modules are Year modules to sync both lists
  private yearModuleIds = new Set<number>();

  roles = ['Student', 'Lecturer', 'Coordinator', 'Admin'];

  private originalHide!: () => void;
  private formDirty = false;

  private modalEl: HTMLElement | null = null;
  private backdropCapture?: (ev: MouseEvent) => void;
  private escCapture?: (ev: KeyboardEvent) => void;

  private sortByCode(a: Module, b: Module) {
    return (a.moduleCode || '').localeCompare(b.moduleCode || '', undefined, { numeric: true, sensitivity: 'base' });
  }

  ngOnInit(): void {
    this.userName = '';
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.password = '';

    this.moduleService.getAllModules().subscribe({
      next: modules => {
        // Fill lists (include Year modules in both)
        this.semester1Modules = modules
          .filter(m => m.semester === 1 || m.isYearModule)
          .sort(this.sortByCode.bind(this));

        this.semester2Modules = modules
          .filter(m => m.semester === 2 || m.isYearModule)
          .sort(this.sortByCode.bind(this));

        // Record which IDs are Year modules for sync logic
        this.yearModuleIds = new Set(modules.filter(m => !!m.isYearModule).map(m => m.id));
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

  markDirty() { this.formDirty = true; }
  togglePasswordVisibility() { this.showPassword = !this.showPassword; }

  /**
   * Sync logic: If a module is a Year module, checking/unchecking it in one list
   * mirrors the selection in the other list so both are always in step.
   */
  toggleModule(mod: Module, semester: 1 | 2, event: any) {
    const checked = !!event.target.checked;
    const id = mod.id;
    const isYear = !!mod.isYearModule || this.yearModuleIds.has(id);

    const primary = (semester === 1) ? this.selectedSemester1 : this.selectedSemester2;
    const other = (semester === 1) ? this.selectedSemester2 : this.selectedSemester1;

    const addIfMissing = (arr: number[], val: number) => { if (!arr.includes(val)) arr.push(val); };
    const removeIfPresent = (arr: number[], val: number) => {
      const i = arr.indexOf(val);
      if (i > -1) arr.splice(i, 1);
    };

    if (checked) {
      addIfMissing(primary, id);
      if (isYear) addIfMissing(other, id);  // auto-tick in the other list
    } else {
      removeIfPresent(primary, id);
      if (isYear) removeIfPresent(other, id); // keep both in sync on uncheck too
    }

    this.formDirty = true;
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
    if (this.formDirty) {
      const discard = await this.openConfirm();
      if (!discard) return;
    }
    this.originalHide();
  }

  submit() {
    const payload = {
      userName: this.userName,
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
