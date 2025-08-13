import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Module } from '../../_models/module';
import { ClassSession } from '../../_models/class-session';
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

type DayState = { checked: boolean; startTime: string; endTime: string; };

interface VenueConfig {
  venue: string;
  days: { [day: string]: DayState };
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

  weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // ✅ Replaces single classVenue + selectedDaysMap
  venues: VenueConfig[] = [];

  assessments: Assessment[] = [];

  activeTab: 'contact' | 'assessments' = 'contact';
  setTab(t: 'contact' | 'assessments') { this.activeTab = t; }

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    public modalRef: BsModalRef
  ) { }

  ngOnInit(): void {
    // Preload sessions from backend to ensure fresh complete data (also fetch assessments)
    this.http.get<Module>(`${this.baseUrl}modules/${this.module.id}`).subscribe({
      next: (updated) => {
        this.module = updated;

        // Build VenueConfig[] from classSessions
        const sessions = (updated.classSessions || []) as ClassSession[];
        const byVenue = new Map<string, VenueConfig>();

        const makeEmptyDays = (): { [d: string]: DayState } => {
          const obj: { [d: string]: DayState } = {};
          this.weekDays.forEach(d => obj[d] = { checked: false, startTime: '', endTime: '' });
          return obj;
        };

        for (const s of sessions) {
          if (!byVenue.has(s.venue)) {
            byVenue.set(s.venue, { venue: s.venue, days: makeEmptyDays() });
          }
          const cfg = byVenue.get(s.venue)!;
          if (cfg.days[s.weekDay]) {
            cfg.days[s.weekDay].checked = true;
            cfg.days[s.weekDay].startTime = s.startTime?.length === 5 ? s.startTime + ':00' : (s.startTime || '');
            cfg.days[s.weekDay].endTime = s.endTime?.length === 5 ? s.endTime + ':00' : (s.endTime || '');
          }
        }

        this.venues = Array.from(byVenue.values());
        if (this.venues.length === 0) {
          // Start with one empty venue row to guide the user
          this.addVenue();
        }

        // Assessments
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
      error: (err) => {
        console.error('❌ Failed to fetch module data:', err);
        // fallback if GET fails: create one empty venue config
        this.addVenue();
        this.assessments = [];
      }
    });
  }

  private formatTimeString(time: string): string | null {
    if (!time) return null;
    return time.length === 5 ? time + ':00' : time;
  }

  // Venue list management
  addVenue(): void {
    const days: { [d: string]: DayState } = {};
    this.weekDays.forEach(d => days[d] = { checked: false, startTime: '', endTime: '' });
    this.venues.push({ venue: '', days });
  }

  removeVenue(index: number): void {
    this.venues.splice(index, 1);
    if (this.venues.length === 0) this.addVenue();
  }

  toggleDay(vIndex: number, day: string): void {
    const state = this.venues[vIndex].days[day];
    state.checked = !state.checked;
    if (!state.checked) {
      state.startTime = '';
      state.endTime = '';
    }
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
    // Build classSessions from venues
    const classSessions: ClassSession[] = [];

    for (const v of this.venues) {
      const venueName = (v.venue || '').trim();
      if (!venueName) continue; // ignore empty venue rows

      for (const day of this.weekDays) {
        const st = v.days[day];
        if (!st.checked) continue;
        const start = this.formatTimeString(st.startTime) || '';
        const end = this.formatTimeString(st.endTime) || '';
        if (!start || !end) continue;

        classSessions.push({
          venue: venueName,
          weekDay: day,
          startTime: start,
          endTime: end
        });
      }
    }

    // Process assessments
    const cleanedAssessments = this.assessments.filter(a => (a.date || '').trim() !== '');
    const processedAssessments = cleanedAssessments.map(a => ({
      title: a.title,
      date: a.date,
      isTimed: a.isTimed,
      startTime: a.isTimed ? this.formatTimeString(a.startTime!) : null,
      endTime: a.isTimed ? this.formatTimeString(a.endTime!) : null,
      dueTime: a.isTimed ? null : this.formatTimeString(a.dueTime!),
      venue: a.isTimed ? a.venue : null
    }));

    // Payload: only the new fields (no legacy venue/arrays)
    const payload: any = {
      classSessions,
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

  cancel() { this.modalRef.hide(); }
}
