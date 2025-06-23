import { Component, Input, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { User } from '../../_models/user';
import { ModuleService } from '../../_services/module.service';
import { AdminService } from '../../_services/admin.service';
import { Module } from '../../_models/module';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-modules-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-modules-modal.component.html',
  styleUrls: ['./edit-modules-modal.component.css']
})
export class EditModulesModalComponent implements OnInit {
  @Input() user!: User;
  @Input() bsModalRef!: BsModalRef<EditModulesModalComponent>;

  semester1Modules: Module[] = [];
  semester2Modules: Module[] = [];

  selectedSemester1: number[] = [];
  selectedSemester2: number[] = [];

  constructor(
    private moduleService: ModuleService,
    private adminService: AdminService,
    private toastr: ToastrService,
    public modalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    this.moduleService.getAllModules().subscribe({
      next: modules => {
        this.semester1Modules = modules.filter(m => m.semester === 1);
        this.semester2Modules = modules.filter(m => m.semester === 2);

        const selectedIds = this.user.modules.map(m => m.id);
        this.selectedSemester1 = this.semester1Modules.filter(m => selectedIds.includes(m.id)).map(m => m.id);
        this.selectedSemester2 = this.semester2Modules.filter(m => selectedIds.includes(m.id)).map(m => m.id);
      },
      error: () => this.toastr.error('Failed to load modules')
    });
  }

  toggleModule(id: number, list: number[], event: any) {
    if (event.target.checked) {
      if (!list.includes(id)) list.push(id);
    } else {
      const index = list.indexOf(id);
      if (index > -1) list.splice(index, 1);
    }
  }

  submit() {
    this.adminService.updateUserModules(this.user.userNumber, this.selectedSemester1, this.selectedSemester2)
      .subscribe({
        next: () => {
          this.toastr.success('Modules updated successfully');
          this.modalRef.hide();
        },
        error: err => {
          const message = err.error?.message || 'Failed to update modules';
          this.toastr.error(message);
        }
      });
  }

  cancel() {
    this.modalRef.hide();
  }

  trackById(index: number, item: Module): number {
    return item.id;
  }
}
