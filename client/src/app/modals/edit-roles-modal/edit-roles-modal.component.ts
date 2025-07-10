import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ Required for *ngFor
import { BsModalRef } from 'ngx-bootstrap/modal';
import { User } from '../../_models/user';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-roles-modal',
  standalone: true,
  imports: [CommonModule], // ✅ Include CommonModule to use *ngFor, *ngIf, etc.
  templateUrl: './edit-roles-modal.component.html',
  styleUrls: ['./edit-roles-modal.component.css']
})
export class EditRolesModalComponent implements OnInit {
  @Input() user!: User;
  @Input() bsModalRef!: BsModalRef<EditRolesModalComponent>;

  roles = ['Admin', 'Student', 'Lecturer', 'Coordinator'];
  selectedRoles: string[] = [];

  baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    public modalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    this.selectedRoles = [...this.user.roles];
  }

  toggleRole(role: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedRoles.includes(role)) this.selectedRoles.push(role);
    } else {
      this.selectedRoles = this.selectedRoles.filter(r => r !== role);
    }
  }

  submit() {
    this.http.put(`${this.baseUrl}admin/update-roles/${this.user.userNumber}`, this.selectedRoles).subscribe({
      next: () => {
        this.toastr.success('Roles updated successfully');
        this.modalRef.hide();
      },
      error: err => {
        console.error('Update failed:', err);
        const message = err.error?.message || 'Failed to update roles';
        this.toastr.error(message);
      }
    });
  }

  cancel() {
    this.modalRef.hide();
  }
}
