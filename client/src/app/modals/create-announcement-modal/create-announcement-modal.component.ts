import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AnnouncementService } from '../../_services/announcement.service';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../../_services/account.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-announcement-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-announcement-modal.component.html',
  styleUrls: ['./create-announcement-modal.component.css']
})
export class CreateAnnouncementModalComponent implements OnInit {
  form!: FormGroup;
  imageFile?: File;
  currentUserRole: string = '';

  constructor(
    public bsModalRef: BsModalRef<CreateAnnouncementModalComponent>,
    private fb: FormBuilder,
    private announcementService: AnnouncementService,
    private toastr: ToastrService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.currentUserRole = this.accountService.getUserRole();
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      type: ['General', Validators.required], // Default is always General
      title: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(5)]],
      moduleId: [null],
      image: [null]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.imageFile = file;
  }

  submit() {
    if (this.form.invalid) {
      this.toastr.error('Please complete all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('type', this.form.get('type')?.value); // Will now reflect selected value
    formData.append('title', this.form.get('title')?.value);
    formData.append('message', this.form.get('message')?.value);
    if (this.form.get('moduleId')?.value)
      formData.append('moduleId', this.form.get('moduleId')?.value.toString());
    if (this.imageFile) formData.append('image', this.imageFile);

    this.announcementService.create(formData).subscribe({
      next: () => {
        this.toastr.success('Announcement posted');
        localStorage.setItem('newAnnouncement', 'true');
        this.bsModalRef.hide();
      },
      error: err => {
        this.toastr.error('Failed to post announcement');
        console.error(err);
      }
    });
  }

  cancel() {
    this.bsModalRef.hide();
  }
}
