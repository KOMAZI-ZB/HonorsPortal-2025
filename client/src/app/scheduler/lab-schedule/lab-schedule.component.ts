// src/app/scheduler/lab-schedule/lab-schedule.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabBooking } from '../../_models/labbooking';
import { AccountService } from '../../_services/account.service';
import { LabbookingService } from '../../_services/labbooking.service';
import { BookLabSlotModalComponent } from '../../modals/book-lab-slot-modal/book-lab-slot-modal.component';
import { UnbookLabSlotModalComponent } from '../../modals/unbook-lab-slot-modal/unbook-lab-slot-modal.component';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-lab-schedule',
  templateUrl: './lab-schedule.component.html',
  styleUrl: './lab-schedule.component.css',
  standalone: true,
  imports: [CommonModule, BookLabSlotModalComponent, UnbookLabSlotModalComponent]
})
export class LabScheduleComponent implements OnInit {
  bookings: LabBooking[] = [];
  timeSlots: string[] = [];
  // Mon–Sat view
  weekdays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  currentWeekStart: Date = this.getUpcomingSunday();

  showBookingModal = false;
  showUnbookingModal = false;
  selectedBookingToDelete: LabBooking | null = null;

  constructor(
    private labbookingService: LabbookingService,
    public accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.generateTimeSlots();
    this.loadBookings();
  }

  get user() { return this.accountService.currentUser(); }
  get roles(): string[] { return this.accountService.roles(); }
  isStudent(): boolean { return this.roles.includes('Student'); }

  get userFullName(): string {
    const u: any = this.user || {};
    const pick = (...cands: any[]) =>
      cands.map(v => (v ?? '').toString().trim()).find(v => v.length > 0) || '';
    let first = pick(u.name);
    let last = pick(u.surname);
    if (!first || !last) {
      const me = pick(u.userName);
      const mine = this.bookings.find(b => (b.userName ?? '') === me);
      if (mine) {
        if (!first) first = pick(mine.firstName);
        if (!last) last = pick(mine.lastName);
      }
    }
    if (first && last) return `${first} ${last}`;
    return first || last || pick(u.displayName, u.username, u.userName);
  }

  /** ⏰ one-hour slots starting exactly at HH:10 (06:10 → 22:10) to match backend (:10) */
  generateTimeSlots() {
    const slots: string[] = [];
    const startHour = 6;      // 06:10
    const startMinute = 10;   // :10
    const totalSlots = 16;    // 06:10→07:10 ... 21:10→22:10
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fmt = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${pad(h)}:${pad(m)}`;
    };

    let fromMins = startHour * 60 + startMinute;
    for (let i = 0; i < totalSlots; i++) {
      const toMins = fromMins + 60;
      slots.push(`${fmt(fromMins)} - ${fmt(toMins)}`);
      fromMins += 60;
    }
    this.timeSlots = slots;
  }

  /** Week starts on Sunday (00:00) */
  getUpcomingSunday(): Date {
    const today = new Date();
    const day = today.getDay(); // Sunday = 0
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - day);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  /** "Lab Schedule: 15–20 September 2025" (Mon–Sat) */
  getWeekDateRangeLabel(): string {
    const start = new Date(this.currentWeekStart);
    const monday = new Date(start); monday.setDate(start.getDate() + 1);
    const saturday = new Date(start); saturday.setDate(start.getDate() + 6);

    const fmtFull = (d: Date) =>
      `${d.getDate()} ${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;

    if (monday.getMonth() === saturday.getMonth() && monday.getFullYear() === saturday.getFullYear()) {
      return `Lab Schedule: ${monday.getDate()}–${fmtFull(saturday)}`;
    }
    const ddMon = monday.getDate();
    const monShort = monday.toLocaleString('default', { month: 'short' });
    const ddSat = saturday.getDate();
    const satShort = saturday.toLocaleString('default', { month: 'short' });
    const year = saturday.getFullYear();
    return `Lab Schedule: ${ddMon} ${monShort} – ${ddSat} ${satShort} ${year}`;
  }

  hasBookingsThisWeek(): boolean {
    if (!this.bookings?.length) return false;
    const start = new Date(this.currentWeekStart);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    return this.bookings.some(b => {
      const apiDate = this.normalizeApiDateString(b.bookingDate);
      if (!apiDate) return false;
      const d = new Date(apiDate);
      return d >= start && d < end;
    });
  }

  getBookingDateForDay(day: string): Date {
    const map: Record<string, number> = {
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6
    };
    const key = (day || '').toLowerCase().trim();
    const offset = map[key] ?? 0;
    const d = new Date(this.currentWeekStart);
    d.setDate(this.currentWeekStart.getDate() + offset);
    return d;
  }

  private fmtDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private normalizeApiDateString(s?: string | null): string | null {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : this.fmtDate(d);
  }

  /** Parse "HH:mm" or "HH:mm:ss" into minutes since midnight */
  private toMinutes(v?: string | null): number | null {
    if (!v) return null;
    const hhmm = v.slice(0, 5);              // HH:mm
    const [h, m] = hhmm.split(':').map(n => +n);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  private overlaps(bs: number | null, be: number | null, ss: number, se: number): boolean {
    if (bs == null || be == null) return false;
    return Math.max(bs, ss) < Math.min(be, se);
  }

  private sameDay(apiDay?: string | null, gridDay?: string | null): boolean {
    const a = (apiDay ?? '').trim().toLowerCase();
    const b = (gridDay ?? '').trim().toLowerCase();
    return a === b || a.startsWith(b) || b.startsWith(a);
  }

  getBookingLabel(day: string, slot: string): string | null {
    const b = this.getBookingObject(day, slot);
    return b ? this.truncate(b.description ?? '') : null;
  }

  truncate(s: string): string { return s.length > 25 ? s.slice(0, 25) + '…' : s; }

  /** Core match: same date & day; any time overlap with slot window */
  getBookingObject(day: string, slot: string): LabBooking | null {
    const date = this.getBookingDateForDay(day);
    const gridDate = this.fmtDate(date);

    // slot string: "HH:mm - HH:mm"
    const [sFrom, sTo] = slot.split(' - ');
    const ss = this.toMinutes(sFrom)!;          // slot start mins
    const se = this.toMinutes(sTo)!;            // slot end mins

    return this.bookings.find(b => {
      const apiDate = this.normalizeApiDateString(b.bookingDate);
      if (!apiDate || apiDate !== gridDate) return false;

      if (!this.sameDay(b.weekDays, day)) return false;

      const bs = this.toMinutes(b.startTime);
      const be = this.toMinutes(b.endTime);
      return this.overlaps(bs, be, ss, se);
    }) || null;
  }

  loadBookings() {
    this.labbookingService.getAllBookings().subscribe({
      next: (res: LabBooking[]) => this.bookings = res || [],
      error: err => { console.error('Failed to load lab bookings', err); this.bookings = []; }
    });
  }

  canBook(): boolean {
    return this.roles.includes('Lecturer') || this.roles.includes('Coordinator') || this.roles.includes('Admin');
  }
  canUnbook(b: LabBooking): boolean {
    return this.roles.includes('Admin') || b.userName === this.user?.userName;
  }

  openBookingModal() { this.showBookingModal = true; }
  closeBookingModal() { this.showBookingModal = false; }

  triggerUnbookModal(b: LabBooking) {
    if (!this.canUnbook(b)) return;
    this.selectedBookingToDelete = b;
    this.showUnbookingModal = true;
  }
  closeUnbookModal() { this.selectedBookingToDelete = null; this.showUnbookingModal = false; }

  handleBookingConfirmed(data: { day: string; time: string; description?: string }) {
    const [sFrom, sTo] = data.time.split(' - ');
    const bookingDateObj = this.getBookingDateForDay(data.day);
    const dto: LabBooking = {
      weekDays: data.day,
      startTime: `${sFrom.slice(0, 5)}:00`,
      endTime: `${sTo.slice(0, 5)}:00`,
      bookingDate: this.fmtDate(bookingDateObj),
      description: (data.description ?? '').slice(0, 25)
    };
    this.labbookingService.createBooking(dto).subscribe({
      next: () => { this.loadBookings(); this.showBookingModal = false; },
      error: err => { console.error('Booking failed:', err); alert('Booking failed: ' + (err.error?.message || 'Please try again.')); this.showBookingModal = false; }
    });
  }

  handleBookingUnconfirmed() {
    if (!this.selectedBookingToDelete?.id) return;
    this.labbookingService.deleteBooking(this.selectedBookingToDelete.id).subscribe({
      next: () => { this.loadBookings(); this.closeUnbookModal(); },
      error: err => { console.error('Unbooking failed:', err); alert('Unbooking failed: ' + (err.error?.message || 'Please try again.')); this.closeUnbookModal(); }
    });
  }

  downloadScheduleAsPdf() {
    const tableElement = document.getElementById('labScheduleTable');
    if (!tableElement) return;
    const options = {
      margin: 0.5,
      filename: 'Lab_Schedule.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2pdf: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'avoid-all'] }
    } as any;
    html2pdf().set(options).from(tableElement).save();
  }
}
