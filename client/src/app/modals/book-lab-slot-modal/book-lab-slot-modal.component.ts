import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-lab-slot-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-lab-slot-modal.component.html',
  styleUrls: ['./book-lab-slot-modal.component.css']
})
export class BookLabSlotModalComponent {
  @Input() weekdays: string[] = [];
  @Input() availableTimeSlots: string[] = [];
  @Output() confirmBooking = new EventEmitter<{ day: string, time: string }>();
  @Output() cancel = new EventEmitter<void>();

  selectedDay: string = '';
  selectedTime: string = '';

  submit() {
    if (this.selectedDay && this.selectedTime) {
      this.confirmBooking.emit({ day: this.selectedDay, time: this.selectedTime });
    }
  }

  close() {
    this.cancel.emit();
  }
}
