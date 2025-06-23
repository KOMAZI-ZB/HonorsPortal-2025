import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Module } from '../../_models/module';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-details-modal',
  standalone: true,
  templateUrl: './edit-details-modal.component.html',
  styleUrls: ['./edit-details-modal.component.css'],
  imports: [CommonModule, FormsModule]
})
export class EditDetailsModalComponent implements OnInit {
  @Input() module!: Module;
  @Input() bsModalRef!: BsModalRef<EditDetailsModalComponent>;

  baseUrl = environment.apiUrl;
  classVenue = '';

  weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  selectedDaysMap: { [day: string]: { checked: boolean; startTime: string; endTime: string } } = {};

  // ✅ Separate test start and end times
  test1Venue = '';
  test1Date = '';
  test1StartTime = '';
  test1EndTime = '';

  test2Venue = '';
  test2Date = '';
  test2StartTime = '';
  test2EndTime = '';

  supplementaryVenue = '';
  supplementaryDate = '';
  supplementaryStartTime = '';
  supplementaryEndTime = '';

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    public modalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    this.classVenue = this.module.classVenue || '';

    this.weekDays.forEach(day => {
      this.selectedDaysMap[day] = { checked: false, startTime: '', endTime: '' };
    });

    const weekDayList: string[] = this.module.weekDays || [];
    const startTimes: string[] = this.module.startTimes || [];
    const endTimes: string[] = this.module.endTimes || [];

    weekDayList.forEach((day: string, i: number) => {
      if (this.selectedDaysMap[day]) {
        this.selectedDaysMap[day].checked = true;
        this.selectedDaysMap[day].startTime = startTimes[i] || '';
        this.selectedDaysMap[day].endTime = endTimes[i] || '';
      }
    });

    this.test1Venue = this.module.test1Venue || '';
    this.test1Date = this.module.test1Date || '';
    this.test1StartTime = this.module.test1StartTime || '';
    this.test1EndTime = this.module.test1EndTime || '';

    this.test2Venue = this.module.test2Venue || '';
    this.test2Date = this.module.test2Date || '';
    this.test2StartTime = this.module.test2StartTime || '';
    this.test2EndTime = this.module.test2EndTime || '';

    this.supplementaryVenue = this.module.supplementaryVenue || '';
    this.supplementaryDate = this.module.supplementaryDate || '';
    this.supplementaryStartTime = this.module.supplementaryStartTime || '';
    this.supplementaryEndTime = this.module.supplementaryEndTime || '';
  }

  private formatTimeString(time: string): string | null {
    if (!time) return null;
    return time.length === 5 ? time + ':00' : time;
  }

  submit() {
    const selectedDays = this.weekDays.filter(day => this.selectedDaysMap[day].checked);
    const startTimes = selectedDays.map(day => this.formatTimeString(this.selectedDaysMap[day].startTime) || '');
    const endTimes = selectedDays.map(day => this.formatTimeString(this.selectedDaysMap[day].endTime) || '');

    const payload = {
      classVenue: this.classVenue || null,
      weekDays: selectedDays,
      startTimes: startTimes,
      endTimes: endTimes,

      test1Venue: this.test1Venue || null,
      test1Date: this.test1Date || null,
      test1StartTime: this.formatTimeString(this.test1StartTime),
      test1EndTime: this.formatTimeString(this.test1EndTime),

      test2Venue: this.test2Venue || null,
      test2Date: this.test2Date || null,
      test2StartTime: this.formatTimeString(this.test2StartTime),
      test2EndTime: this.formatTimeString(this.test2EndTime),

      supplementaryVenue: this.supplementaryVenue || null,
      supplementaryDate: this.supplementaryDate || null,
      supplementaryStartTime: this.formatTimeString(this.supplementaryStartTime),
      supplementaryEndTime: this.formatTimeString(this.supplementaryEndTime)
    };

    this.http.put<any>(`${this.baseUrl}modules/${this.module.id}`, payload).subscribe({
      next: response => {
        this.toastr.success('Module details updated');
        if (response.announcement) {
          this.toastr.info(`An announcement was triggered for ${this.module.moduleCode}`, 'Schedule Updated');
          console.log('🔔 Announcement:', response.announcement);
        }
        this.modalRef.hide();
      },
      error: err => {
        this.toastr.error('Failed to update module');
        console.error(err);
      }
    });
  }

  toggleDay(day: string): void {
    const entry = this.selectedDaysMap[day];
    if (!entry) return;

    entry.checked = !entry.checked;

    if (!entry.checked) {
      entry.startTime = '';
      entry.endTime = '';
    }
  }

  cancel() {
    this.modalRef.hide();
  }
}
