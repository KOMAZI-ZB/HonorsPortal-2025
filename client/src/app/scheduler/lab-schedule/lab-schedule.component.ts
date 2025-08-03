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

  get user() {
    return this.accountService.currentUser();
  }

  get roles(): string[] {
    return this.accountService.roles();
  }

  generateTimeSlots() {
    const startHour = 6;
    for (let i = 0; i < 15; i++) {
      const from = `${(startHour + i).toString().padStart(2, '0')}:00`;
      const to = `${(startHour + i + 1).toString().padStart(2, '0')}:00`;
      this.timeSlots.push(`${from} - ${to}`);
    }
  }

  getUpcomingSunday(): Date {
    const today = new Date();
    const day = today.getDay(); // Sunday = 0
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - day);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  // ✅ Fix: use a daysMap to align correctly with bookingDate
  getBookingDateForDay(day: string): Date {
    const daysMap: Record<string, number> = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };

    const date = new Date(this.currentWeekStart);
    const offset = daysMap[day] ?? 0;
    date.setDate(this.currentWeekStart.getDate() + offset);
    return date;
  }

  getBookingLabel(day: string, time: string): string | null {
    const booking = this.getBookingObject(day, time);
    return booking ? this.truncateDescription(booking.description ?? '') : null;
  }

  truncateDescription(desc: string): string {
    return desc.length > 25 ? desc.slice(0, 25) + '…' : desc;
  }

  getBookingObject(day: string, time: string): LabBooking | null {
    const date = this.getBookingDateForDay(day);
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    const start = time.split(' - ')[0];

    return this.bookings.find(b =>
      b.weekDays === day &&
      b.startTime.startsWith(start) &&
      b.bookingDate === formattedDate
    ) || null;
  }

  loadBookings() {
    this.labbookingService.getAllBookings().subscribe({
      next: (res: LabBooking[]) => this.bookings = res
    });
  }

  canBook(): boolean {
    return this.roles.includes('Lecturer') || this.roles.includes('Coordinator') || this.roles.includes('Admin');
  }

  canUnbook(booking: LabBooking): boolean {
    return this.roles.includes('Admin') || booking.userNumber === this.user?.userNumber;
  }

  openBookingModal() {
    this.showBookingModal = true;
  }

  closeBookingModal() {
    this.showBookingModal = false;
  }

  triggerUnbookModal(booking: LabBooking) {
    if (!this.canUnbook(booking)) return;
    this.selectedBookingToDelete = booking;
    this.showUnbookingModal = true;
  }

  closeUnbookModal() {
    this.selectedBookingToDelete = null;
    this.showUnbookingModal = false;
  }

  handleBookingConfirmed(data: { day: string; time: string; description?: string }) {
    const start = data.time.split(' - ')[0];
    const end = data.time.split(' - ')[1];

    const bookingDateObj = this.getBookingDateForDay(data.day);
    const yyyy = bookingDateObj.getFullYear();
    const mm = (bookingDateObj.getMonth() + 1).toString().padStart(2, '0');
    const dd = bookingDateObj.getDate().toString().padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    const formattedStartTime = `${start}:00`;
    const formattedEndTime = `${end}:00`;

    const dto: LabBooking = {
      weekDays: data.day,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      bookingDate: formattedDate,
      description: data.description?.slice(0, 25) ?? ''
    };

    this.labbookingService.createBooking(dto).subscribe({
      next: () => {
        this.loadBookings();
        this.showBookingModal = false;
      },
      error: err => {
        console.error('Booking failed:', err);
        alert('Booking failed: ' + (err.error?.message || 'Please try again.'));
        this.showBookingModal = false;
      }
    });
  }

  handleBookingUnconfirmed() {
    if (!this.selectedBookingToDelete?.id) return;

    this.labbookingService.deleteBooking(this.selectedBookingToDelete.id).subscribe({
      next: () => {
        this.loadBookings();
        this.closeUnbookModal();
      },
      error: err => {
        console.error('Unbooking failed:', err);
        alert('Unbooking failed: ' + (err.error?.message || 'Please try again.'));
        this.closeUnbookModal();
      }
    });
  }

  downloadScheduleAsPdf() {
    const tableElement = document.getElementById('labScheduleTable');
    if (!tableElement) return;

    const options = {
      margin: 0.5,
      filename: 'Lab_Schedule.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(options).from(tableElement).save();
  }
}
