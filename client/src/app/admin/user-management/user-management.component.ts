import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { User } from '../../_models/user';

import { AddUserModalComponent } from '../../modals/add-user-modal/add-user-modal.component';
import { EditModulesModalComponent } from '../../modals/edit-modules-modal/edit-modules-modal.component';
import { EditRolesModalComponent } from '../../modals/edit-roles-modal/edit-roles-modal.component';
import { DeleteUserModalComponent } from '../../modals/delete-user-modal/delete-user-modal.component';
import { AdminService } from '../../_services/admin.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  modalRef?: BsModalRef;

  constructor(
    private adminService: AdminService,
    private modalService: BsModalService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe({
      next: users => {
        this.users = users;
      }
    });
  }

  trackByUserNumber(index: number, user: User): string {
    return user.userNumber;
  }

  openAddUserModal() {
    this.modalRef = this.modalService.show(AddUserModalComponent, { class: 'modal-lg' });
    this.modalRef.onHidden?.subscribe(() => this.loadUsers());
  }

  openEditModulesModal(user: User) {
    // ✅ Ensure we use user from getAllUsers (with modules preloaded)
    const matchedUser = this.users.find(u => u.userNumber === user.userNumber);
    if (!matchedUser) return;

    this.modalRef = this.modalService.show(EditModulesModalComponent, {
      initialState: { user: matchedUser },
      class: 'modal-lg'
    });
    this.modalRef.onHidden?.subscribe(() => this.loadUsers());
  }

  openEditRolesModal(user: User) {
    this.modalRef = this.modalService.show(EditRolesModalComponent, {
      initialState: { user }
    });
    this.modalRef.onHidden?.subscribe(() => this.loadUsers());
  }

  openDeleteUserModal(user: User) {
    this.modalRef = this.modalService.show(DeleteUserModalComponent, {
      initialState: { user }
    });
    this.modalRef.onHidden?.subscribe(() => this.loadUsers());
  }
}
