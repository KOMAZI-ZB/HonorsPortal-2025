import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AdminService } from '../../_services/admin.service';
import { ModuleService } from '../../_services/module.service';
import { Module } from '../../_models/module';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css']
})
export class AddUserModalComponent implements OnInit, AfterViewInit {
  constructor(
    private adminService: AdminService,
    private moduleService: ModuleService,
    private toastr: ToastrService,
    public modalRef: BsModalRef
  ) { }

  // 🔹 Focus handle for the first field
  @ViewChild('usernameInput') usernameInput!: ElementRef<HTMLInputElement>;

  // 🔹 Ensure not prefilled
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

  ngOnInit(): void {
    // Keep fields empty on open
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
  }

  ngAfterViewInit(): void {
    // Put cursor in the first field after view is ready
    setTimeout(() => this.usernameInput?.nativeElement.focus(), 0);
  }

  toggleModule(id: number, list: number[], event: any) {
    if (event.target.checked) {
      if (!list.includes(id)) list.push(id);
    } else {
      const index = list.indexOf(id);
      if (index > -1) list.splice(index, 1);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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
        this.modalRef.hide();
      },
      error: (err: any) => {
        const msg = err.error?.message || 'Failed to register user';
        this.toastr.error(msg);
      }
    });
  }

  cancel() {
    this.modalRef.hide();
  }
}
