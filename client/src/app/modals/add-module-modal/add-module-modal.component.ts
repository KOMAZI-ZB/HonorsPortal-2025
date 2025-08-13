import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

interface Assessment {
  title: string;
  date: string;       // ISO date (YYYY-MM-DD)
  isTimed: boolean;   // true = venue & start/end times; false = submission with dueTime
  startTime?: string; // HH:mm or HH:mm:ss
  endTime?: string;   // HH:mm or HH:mm:ss
  dueTime?: string;   // HH:mm or HH:mm:ss
  venue?: string;
}

@Component({
  selector: 'app-add-module-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-module-modal.component.html',
  styleUrls: ['./add-module-modal.component.css']
})
export class AddModuleModalComponent implements AfterViewInit {
  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    public modalRef: BsModalRef
  ) { }

  baseUrl = environment.apiUrl;

  @ViewChild('moduleCodeInput') moduleCodeInput!: ElementRef<HTMLInputElement>;

  // Basic details
  moduleCode = '';
  moduleName = '';
  semester = 1;

  // Class schedule
  classVenue = '';
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  selectedDays: { [key: string]: boolean } = {};
  startTimes: { [key: string]: string } = {};
  endTimes: { [key: string]: string } = {};

  // Assessments (dynamic)
  assessments: Assessment[] = [];

  // 🔒 Unsaved changes guard
  private formDirty = false;

  ngAfterViewInit(): void {
    // Auto-focus the first field (Module Code) when the modal opens
    setTimeout(() => this.moduleCodeInput?.nativeElement.focus(), 0);
  }

  // Mark the form as dirty when any field changes
  markDirty(): void {
    this.formDirty = true;
  }

  private formatTimeString(time: string): string | null {
    if (!time) return null;
    // Normalize "HH:mm" to "HH:mm:ss" for backend consistency
    return time.length === 5 ? time + ':00' : time;
  }

  addAssessment(): void {
    this.assessments.push({
      title: '',
      date: '',
      isTimed: true,
      startTime: '',
      endTime: '',
      venue: ''
    });
    this.markDirty();
  }

  removeAssessment(index: number): void {
    this.assessments.splice(index, 1);
    this.markDirty();
  }

  submit(): void {
    // Collect class days and times
    const chosenDays: string[] = [];
    const starts: string[] = [];
    const ends: string[] = [];

    for (const day of this.weekDays) {
      if (this.selectedDays[day]) {
        chosenDays.push(day);
        starts.push(this.startTimes[day] || '');
        ends.push(this.endTimes[day] || '');
      }
    }

    // Prepare assessments (filter out any without a date)
    const cleanedAssessments = this.assessments.filter(a => a.date && a.date.trim() !== '');

    const processedAssessments = cleanedAssessments.map(a => ({
      title: a.title,
      date: a.date,
      isTimed: a.isTimed,
      startTime: a.isTimed ? this.formatTimeString(a.startTime || '') : null,
      endTime: a.isTimed ? this.formatTimeString(a.endTime || '') : null,
      dueTime: a.isTimed ? null : this.formatTimeString(a.dueTime || ''),
      venue: a.isTimed ? (a.venue || '') : null
    }));

    const payload = {
      moduleCode: this.moduleCode,
      moduleName: this.moduleName,
      semester: this.semester,
      classVenue: this.classVenue || null,

      weekDays: chosenDays,   // arrays as per backend
      startTimes: starts,
      endTimes: ends,

      assessments: processedAssessments
    };

    this.http.post(this.baseUrl + 'modules', payload).subscribe({
      next: () => {
        this.toastr.success('Module added successfully');
        this.formDirty = false; // ✅ inputs are saved
        this.modalRef.hide();
      },
      error: err => {
        this.toastr.error('Failed to add module');
        console.error(err);
      }
    });
  }

  // Centralized close attempt with confirmation if dirty
  private attemptClose(): void {
    if (!this.formDirty) {
      this.modalRef.hide();
      return;
    }

    const confirmClose = window.confirm(
      'You have unsaved changes. If you exit now, your data will be lost.\n\nPress OK to exit, or Cancel to stay.'
    );
    if (confirmClose) {
      this.modalRef.hide();
    }
  }

  // Cancel button funnels here
  cancel(): void {
    this.attemptClose();
  }

  // Optional: catch browser/tab close/refresh to warn (does not affect modal backdrop)
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: BeforeUnloadEvent) {
    if (this.formDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
