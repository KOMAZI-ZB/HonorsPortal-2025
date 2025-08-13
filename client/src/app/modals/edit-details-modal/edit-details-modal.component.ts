import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Module } from '../../_models/module';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

interface Assessment {
  title: string;
  date: string;
  isTimed: boolean;
  startTime?: string;
  endTime?: string;
  dueTime?: string;
  venue?: string;
}

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

  assessments: Assessment[] = [];

  // ✅ Minimal state for tabs
  activeTab: 'venue' | 'contact' | 'assessments' = 'venue';
  setTab(t: 'venue' | 'contact' | 'assessments') { this.activeTab = t; }

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

    const weekDayList = this.module.weekDays || [];
    const startTimes = this.module.startTimes || [];
    const endTimes = this.module.endTimes || [];

    weekDayList.forEach((day, i) => {
      if (this.selectedDaysMap[day]) {
        this.selectedDaysMap[day].checked = true;
        this.selectedDaysMap[day].startTime = startTimes[i] || '';
        this.selectedDaysMap[day].endTime = endTimes[i] || '';
      }
    });

    // 🆕 Fetch the full module from the backend (ensures assessments are fresh and complete)
    this.http.get<Module>(`${this.baseUrl}modules/${this.module.id}`).subscribe({
      next: updated => {
        this.assessments = (updated.assessments || []).map(a => ({
          title: a.title,
          date: a.date,
          isTimed: a.isTimed,
          startTime: a.startTime || '',
          endTime: a.endTime || '',
          dueTime: a.dueTime || '',
          venue: a.venue || ''
        }));
      },
      error: err => {
        console.error('❌ Failed to fetch module data:', err);
        this.assessments = [];
      }
    });
  }

  private formatTimeString(time: string): string | null {
    if (!time) return null;
    return time.length === 5 ? time + ':00' : time;
  }

  addAssessment() {
    this.assessments.push({
      title: '',
      date: '',
      isTimed: true,
      startTime: '',
      endTime: '',
      venue: ''
    });
  }

  removeAssessment(index: number) {
    this.assessments.splice(index, 1);
  }

  submit() {
    const selectedDays = this.weekDays.filter(day => this.selectedDaysMap[day].checked);
    const startTimes = selectedDays.map(day => this.formatTimeString(this.selectedDaysMap[day].startTime) || '');
    const endTimes = selectedDays.map(day => this.formatTimeString(this.selectedDaysMap[day].endTime) || '');

    const cleanedAssessments = this.assessments.filter(a => a.date && a.date.trim() !== '');

    const processedAssessments = cleanedAssessments.map(a => ({
      title: a.title,
      date: a.date,
      isTimed: a.isTimed,
      startTime: a.isTimed ? this.formatTimeString(a.startTime!) : null,
      endTime: a.isTimed ? this.formatTimeString(a.endTime!) : null,
      dueTime: a.isTimed ? null : this.formatTimeString(a.dueTime!),
      venue: a.isTimed ? a.venue : null
    }));

    const payload = {
      classVenue: this.classVenue || null,
      weekDays: selectedDays,
      startTimes,
      endTimes,
      assessments: processedAssessments
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
