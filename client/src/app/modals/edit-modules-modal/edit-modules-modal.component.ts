import { Component, Input, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { User } from '../../_models/user';
import { ModuleService } from '../../_services/module.service';
import { AdminService } from '../../_services/admin.service';
import { Module } from '../../_models/module';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmCloseModalComponent } from '../confirm-close-modal/confirm-close-modal.component';

@Component({
  selector: 'app-edit-modules-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-modules-modal.component.html',
  styleUrls: ['./edit-modules-modal.component.css']
})
export class EditModulesModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() user!: User;
  @Input() bsModalRef!: BsModalRef<EditModulesModalComponent>;

  // keep full list to rebuild both semester lists as flags change
  private allModules: Module[] = [];

  semester1Modules: Module[] = [];
  semester2Modules: Module[] = [];

  selectedSemester1: number[] = [];
  selectedSemester2: number[] = [];

  // inline semester picker state when turning Year -> normal
  pickingSemesterFor: number | null = null;
  semesterChoice: { [id: number]: 1 | 2 } = {};

  private originalHide!: () => void;
  private justSaved = false;
  private locallyDirty = false;

  private modalEl: HTMLElement | null = null;
  private backdropCapture?: (ev: MouseEvent) => void;
  private escCapture?: (ev: KeyboardEvent) => void;

  // Known year modules (safety net) if backend hasn’t been updated everywhere
  private readonly yearModuleCodes = new Set<string>(['CSIS6809', 'BCIS6809']);

  constructor(
    private moduleService: ModuleService,
    private adminService: AdminService,
    private toastr: ToastrService,
    public modalRef: BsModalRef,
    private bsModalService: BsModalService,
    private elRef: ElementRef<HTMLElement>
  ) { }

  ngOnInit(): void {
    const ref = this.bsModalRef ?? this.modalRef;
    this.originalHide = ref.hide.bind(ref);
    ref.hide = () => this.attemptClose();

    this.moduleService.getAllModules().subscribe({
      next: modules => {
        this.allModules = modules;

        // Build semester lists (include year modules in both)
        this.rebuildSemesterLists();

        // Pre-select for this user
        const selectedIds = this.user.modules.map(m => m.id);
        this.selectedSemester1 = this.semester1Modules.filter(m => selectedIds.includes(m.id)).map(m => m.id);
        this.selectedSemester2 = this.semester2Modules.filter(m => selectedIds.includes(m.id)).map(m => m.id);

        this.locallyDirty = false;
      },
      error: () => this.toastr.error('Failed to load modules')
    });
  }

  // Year module = semester 0 OR known codes OR backend-provided flag (if exists)
  isYear(m: Module): boolean {
    const code = (m.moduleCode || '').toUpperCase();
    return (m as any).isYearModule === true || m.semester === 0 || this.yearModuleCodes.has(code);
  }

  private rebuildSemesterLists(): void {
    this.semester1Modules = this.allModules.filter(m => m.semester === 1 || this.isYear(m));
    this.semester2Modules = this.allModules.filter(m => m.semester === 2 || this.isYear(m));
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
    return this.locallyDirty;
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

  toggleModule(id: number, list: number[], event: any) {
    if (event.target.checked) {
      if (!list.includes(id)) list.push(id);
    } else {
      const index = list.indexOf(id);
      if (index > -1) list.splice(index, 1);
    }
    this.locallyDirty = true;
  }

  // === Year toggle handlers ===
  onYearToggle(mod: Module, ev: any) {
    const checked = !!ev.target.checked;

    if (checked) {
      // Set Year (no semester needed)
      this.moduleService.updateModule(mod.id, { isYearModule: true } as any).subscribe({
        next: () => {
          this.toastr.success(`Marked ${mod.moduleCode} as a Year module`);
          this.updateLocalSemester(mod.id, 0);
        },
        error: (err) => {
          this.toastr.error('Failed to mark as Year module');
          console.error(err);
        }
      });
    } else {
      // Switching OFF Year → ask which semester
      this.pickingSemesterFor = mod.id;
      this.semesterChoice[mod.id] = 1; // default suggestion
    }
  }

  applySemester(mod: Module) {
    const sem = this.semesterChoice[mod.id] || 1;
    this.moduleService.updateModule(mod.id, { isYearModule: false, semester: sem } as any).subscribe({
      next: () => {
        this.toastr.success(`${mod.moduleCode} set to Semester ${sem}`);
        this.updateLocalSemester(mod.id, sem);
        this.pickingSemesterFor = null;
        delete this.semesterChoice[mod.id];
      },
      error: (err) => {
        this.toastr.error('Failed to set semester');
        console.error(err);
      }
    });
  }

  cancelSemesterPick() {
    this.pickingSemesterFor = null;
  }

  private updateLocalSemester(id: number, newSemester: number) {
    const m = this.allModules.find(x => x.id === id);
    if (m) m.semester = newSemester;
    this.rebuildSemesterLists();
  }

  submit() {
    this.adminService.updateUserModules(this.user.userName, this.selectedSemester1, this.selectedSemester2)
      .subscribe({
        next: () => { this.toastr.success('Modules updated successfully'); this.justSaved = true; this.originalHide(); },
        error: err => { const message = err.error?.message || 'Failed to update modules'; this.toastr.error(message); }
      });
  }

  cancel() { this.attemptClose(); }

  trackById(index: number, item: Module): number { return item.id; }
}
