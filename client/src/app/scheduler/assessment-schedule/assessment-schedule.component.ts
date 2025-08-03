import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessmentSchedule } from '../../_models/assessment-schedule';
import { SchedulerService } from '../../_services/scheduler.service';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-assessment-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assessment-schedule.component.html',
  styleUrls: ['./assessment-schedule.component.css']
})
export class AssessmentScheduleComponent implements OnInit {
  assessments: AssessmentSchedule[] = [];
  groupedAssessments: { [month: string]: AssessmentSchedule[] } = {};
  groupedMonths: string[] = [];
  semester: number = 1;

  constructor(private schedulerService: SchedulerService) { }

  ngOnInit(): void {
    this.loadSchedule();
  }

  onSemesterChange(): void {
    this.loadSchedule();
  }

  formatTime(time: string | null | undefined): string {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }

  loadSchedule(): void {
    this.schedulerService.getAssessmentSchedule(this.semester).subscribe({
      next: res => {
        this.assessments = res;
        const groups: { [month: string]: AssessmentSchedule[] } = {};

        for (let a of res) {
          if (!a || !a.date) continue;
          const month = new Date(a.date).toLocaleString('default', {
            month: 'long',
            year: 'numeric'
          });

          if (!groups[month]) groups[month] = [];
          groups[month].push(a);
        }

        for (let month in groups) {
          groups[month] = groups[month].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
              return dateA.getTime() - dateB.getTime();
            }

            const timeA = a.startTime || a.dueTime || '00:00';
            const timeB = b.startTime || b.dueTime || '00:00';
            return timeA.localeCompare(timeB);
          });
        }

        this.groupedAssessments = groups;
        this.groupedMonths = Object.keys(groups);
      },
      error: err => console.log(err)
    });
  }

  downloadScheduleAsPdf(): void {
    const tableElement = document.getElementById('pdfContent');
    if (!tableElement) return;

    const options = {
      margin: 0.5,
      filename: 'Assessment_Schedule.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(options).from(tableElement).save();
  }
}
