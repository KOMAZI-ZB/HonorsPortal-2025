import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Module } from '../../_models/module';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-name-modal',
  standalone: true,
  templateUrl: './edit-name-modal.component.html',
  styleUrls: ['./edit-name-modal.component.css'],
  imports: [CommonModule, FormsModule]
})
export class EditNameModalComponent implements OnInit {
  @Input() module!: Module;
  @Input() bsModalRef!: BsModalRef<EditNameModalComponent>;

  newName = '';
  baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    public modalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    this.newName = this.module.moduleName;
  }

  submit() {
    const payload = {
      moduleName: this.newName,
      classVenue: this.module.classVenue || null,
      weekDays: this.module.weekDays || null,
      startTimes: this.module.startTimes || null,
      endTimes: this.module.endTimes || null,


    };

    this.http.put(`${this.baseUrl}modules/${this.module.id}`, payload).subscribe({
      next: () => {
        this.toastr.success('Module name updated successfully');
        this.modalRef.hide();
      },
      error: err => {
        this.toastr.error('Failed to update module name');
        console.error(err);
      }
    });
  }

  cancel() {
    this.modalRef.hide();
  }
}
