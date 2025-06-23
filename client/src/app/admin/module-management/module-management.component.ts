// src/app/module-management/module-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './module-management.component.html',
  styleUrls: ['./module-management.component.css']
})
export class ModuleManagementComponent implements OnInit {
  modules: Module[] = [];
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
      next: modules => (this.modules = modules)
    });
  }

  openAddModuleModal() {
    this.modalRef = this.modalService.show(AddModuleModalComponent, {
      class: 'modal-lg'
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
}
