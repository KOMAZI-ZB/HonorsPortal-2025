import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestSchedule } from '../../_models/test-schedule';
import { SchedulerService } from '../../_services/scheduler.service';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-test-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-schedule.component.html',
  styleUrls: ['./test-schedule.component.css']
})
export class TestScheduleComponent implements OnInit {
  testSchedules: TestSchedule[] = [];
  semester: number = 1;
  testTypes: string[] = ['Test 1', 'Test 2', 'Supplementary'];

  constructor(private schedulerService: SchedulerService) { }

  ngOnInit(): void {
    this.loadSchedule();
  }

  onSemesterChange(): void {
    this.loadSchedule();
  }

  loadSchedule(): void {
    this.schedulerService.getTestSchedule(this.semester).subscribe({
      next: res => this.testSchedules = res,
      error: err => console.log(err)
    });
  }

  groupByTestType(type: string): TestSchedule[] {
    return this.testSchedules
      .filter(t => t.testType === type)
      .sort((a, b) => (a.testDate || '').localeCompare(b.testDate || ''));
  }

  downloadScheduleAsPdf(): void {
    const tableElement = document.getElementById('testScheduleTable');
    if (!tableElement) return;

    const options = {
      margin: 0.5,
      filename: 'Test_Schedule.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(options).from(tableElement).save();
  }
}
