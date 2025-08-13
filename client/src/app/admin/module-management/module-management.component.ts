import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Required for [(ngModel)]
import { ModuleService } from '../../_services/module.service';
import { Module } from '../../_models/module';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AddModuleModalComponent } from '../../modals/add-module-modal/add-module-modal.component';
import { DeleteModuleModalComponent } from '../../modals/delete-module-modal/delete-module-modal.component';
import { EditCodeModalComponent } from '../../modals/edit-code-modal/edit-code-modal.component';
import { EditDetailsModalComponent } from '../../modals/edit-details-modal/edit-details-modal.component';
import { EditNameModalComponent } from '../../modals/edit-name-modal/edit-name-modal.component';

@Component({
  selector: 'app-module-management',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ Include FormsModule here
  templateUrl: './module-management.component.html',
  styleUrls: ['./module-management.component.css']
})
export class ModuleManagementComponent implements OnInit {
  modules: Module[] = [];
  filteredModules: Module[] = [];
  searchTerm: string = '';
  modalRef?: BsModalRef;

  constructor(
    private moduleService: ModuleService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules() {
    this.moduleService.getAllModules().subscribe({
      next: modules => {
        this.modules = modules;
        // ✅ Apply default sort: Semester (1 first) then Module Code
        this.filteredModules = this.applyDefaultSort([...modules]);
      }
    });
  }

  filterModules(): void {
    const term = this.searchTerm.toLowerCase();
    const list = this.modules.filter(mod =>
      mod.moduleCode.toLowerCase().includes(term) ||
      mod.moduleName.toLowerCase().includes(term)
    );
    // ✅ Keep same filter, just apply the required default sort to the result
    this.filteredModules = this.applyDefaultSort(list);
  }

  openAddModuleModal() {
    this.modalRef = this.modalService.show(AddModuleModalComponent, {
      class: 'modal-lg',
      ignoreBackdropClick: true, // ✅ Prevent backdrop click from closing
      keyboard: false            // ✅ Prevent ESC key from closing
    });
    this.modalRef.onHidden?.subscribe(() => this.loadModules());
  }

  openEditNameModal(module: Module) {
    this.modalRef = this.modalService.show(EditNameModalComponent, {
      initialState: { module }
    });
    this.modalRef.onHidden?.subscribe(() => this.loadModules());
  }

  openEditCodeModal(module: Module) {
    this.modalRef = this.modalService.show(EditCodeModalComponent, {
      initialState: { module }
    });
    this.modalRef.onHidden?.subscribe(() => this.loadModules());
  }

  openEditDetailsModal(module: Module) {
    this.modalRef = this.modalService.show(EditDetailsModalComponent, {
      initialState: { module },
      class: 'modal-lg'
    });
    this.modalRef.onHidden?.subscribe(() => this.loadModules());
  }

  openDeleteModuleModal(module: Module) {
    this.modalRef = this.modalService.show(DeleteModuleModalComponent, {
      initialState: { module }
    });
    this.modalRef.onHidden?.subscribe(() => this.loadModules());
  }

  trackById(index: number, item: Module): number {
    return item.id;
  }

  // ========= Helpers: Default sort by Semester then Module Code =========
  private applyDefaultSort(list: Module[]): Module[] {
    return list.sort((a, b) => {
      const sa = this.semesterRank(a.semester);
      const sb = this.semesterRank(b.semester);
      if (sa !== sb) return sa - sb;

      const codeA = (a.moduleCode || '').toString();
      const codeB = (b.moduleCode || '').toString();
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  private semesterRank(value: any): number {
    // Handles 1/2 as numbers or strings like "1", "Semester 1", "Sem 1", "S1"
    if (value === 1 || String(value).trim() === '1') return 1;
    const v = String(value || '').toLowerCase().trim();
    if (v.includes('semester 1') || v === 'sem 1' || v === 's1') return 1;
    if (value === 2 || String(value).trim() === '2') return 2;
    if (v.includes('semester 2') || v === 'sem 2' || v === 's2') return 2;
    // Anything else goes after Sem 1 and 2
    return 99;
  }
}
