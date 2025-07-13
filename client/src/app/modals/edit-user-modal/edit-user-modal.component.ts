import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { User } from '../../_models/user';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user-modal.component.html',
  styleUrls: ['./edit-user-modal.component.css']
})
export class EditUserModalComponent implements OnInit {
  @Input() user!: User;
  @Input() bsModalRef!: BsModalRef<EditUserModalComponent>;

  roles = ['Admin', 'Student', 'Lecturer', 'Coordinator'];
  selectedRoles: string[] = [];

  firstName = '';
  lastName = '';
  email = '';
  updatePassword = '';
  showPassword = false;

  baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    public modalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    this.firstName = this.user.name;
    this.lastName = this.user.surname;
    this.email = this.user.email;
    this.selectedRoles = [...this.user.roles];
  }

  toggleRole(role: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedRoles.includes(role)) this.selectedRoles.push(role);
    } else {
      this.selectedRoles = this.selectedRoles.filter(r => r !== role);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  submit() {
    const payload = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      updatePassword: this.updatePassword || null,
      roles: this.selectedRoles
    };

    this.http.put(`${this.baseUrl}admin/update-user/${this.user.userNumber}`, payload).subscribe({
      next: () => {
        this.toastr.success('User updated successfully');
        this.modalRef.hide();
      },
      error: err => {
        console.error('Update failed:', err);
        const message = err.error?.message || 'Failed to update user';
        this.toastr.error(message);
      }
    });
  }

  cancel() {
    this.modalRef.hide();
  }
}
