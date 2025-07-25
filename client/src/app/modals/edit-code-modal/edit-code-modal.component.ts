import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Module } from '../../_models/module';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-code-modal',
  standalone: true,
  templateUrl: './edit-code-modal.component.html',
  styleUrls: ['./edit-code-modal.component.css'],
  imports: [CommonModule, FormsModule]
})
export class EditCodeModalComponent implements OnInit {
  @Input() module!: Module;
  @Input() bsModalRef!: BsModalRef<EditCodeModalComponent>;

  newCode = '';
  baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    public modalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    this.newCode = this.module.moduleCode;
  }

  submit() {
    const payload = {
      moduleCode: this.newCode,
      classVenue: this.module.classVenue || null,
      weekDays: this.module.weekDays || null,
      startTimes: this.module.startTimes || null,
      endTimes: this.module.endTimes || null,

      test1Venue: this.module.test1Venue || null,
      test1Date: this.module.test1Date || null,
      test1StartTime: this.module.test1StartTime || null,
      test1EndTime: this.module.test1EndTime || null,

      test2Venue: this.module.test2Venue || null,
      test2Date: this.module.test2Date || null,
      test2StartTime: this.module.test2StartTime || null,
      test2EndTime: this.module.test2EndTime || null,

      supplementaryVenue: this.module.supplementaryVenue || null,
      supplementaryDate: this.module.supplementaryDate || null,
      supplementaryStartTime: this.module.supplementaryStartTime || null,
      supplementaryEndTime: this.module.supplementaryEndTime || null
    };

    this.http.put(`${this.baseUrl}modules/${this.module.id}`, payload).subscribe({
      next: () => {
        this.toastr.success('Module code updated successfully');
        this.modalRef.hide();
      },
      error: err => {
        this.toastr.error('Failed to update module code');
        console.error(err);
      }
    });
  }

  cancel() {
    this.modalRef.hide();
  }
}
