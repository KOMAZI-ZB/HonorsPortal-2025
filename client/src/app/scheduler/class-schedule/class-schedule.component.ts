import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassSchedule } from '../../_models/class-schedule';
import { SchedulerService } from '../../_services/scheduler.service';
import html2pdf from 'html2pdf.js';

interface TimeBlock {
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-class-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-schedule.component.html',
  styleUrls: ['./class-schedule.component.css']
})
export class ClassScheduleComponent implements OnInit {
  schedules: ClassSchedule[] = [];
  semester: number = 1;
  weekdays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  timeBlocks: TimeBlock[] = [];
  blockMap: { [key: string]: { moduleCode: string; classVenue?: string }[] } = {};

  constructor(private schedulerService: SchedulerService) { }

  ngOnInit(): void {
    this.loadSchedule();
  }

  loadSchedule(): void {
    this.schedulerService.getClassSchedule(this.semester).subscribe({
      next: (response) => {
        this.schedules = response;
        this.generateTimeBlocks();
        this.buildBlockMap();
      },
      error: (err) => console.log(err)
    });
  }

  onSemesterChange(): void {
    this.loadSchedule();
  }

  generateTimeBlocks(): void {
    const seen = new Set<string>();
    const blocks: TimeBlock[] = [];

    this.schedules.forEach(schedule => {
      const starts = schedule.startTimes || [];
      const ends = schedule.endTimes || [];

      for (let i = 0; i < starts.length; i++) {
        const start = starts[i];
        const end = ends[i];
        if (start && end) {
          const key = `${start}-${end}`;
          if (!seen.has(key)) {
            seen.add(key);
            blocks.push({ startTime: start, endTime: end });
          }
        }
      }
    });

    this.timeBlocks = blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  buildBlockMap(): void {
    this.blockMap = {};

    this.timeBlocks.forEach(block => {
      this.weekdays.forEach(day => {
        const key = `${block.startTime}-${block.endTime}-${day}`;
        const entries: { moduleCode: string; classVenue?: string }[] = [];

        this.schedules.forEach(schedule => {
          const index = (schedule.weekDays || []).findIndex(d => d.toLowerCase() === day.toLowerCase());
          if (index === -1) return;

          const start = schedule.startTimes?.[index];
          const end = schedule.endTimes?.[index];

          const isExactMatch = start === block.startTime && end === block.endTime;
          if (isExactMatch) {
            const exists = entries.some(e => e.moduleCode === schedule.moduleCode);
            if (!exists) {
              entries.push({ moduleCode: schedule.moduleCode, classVenue: schedule.classVenue });
            }
          }
        });

        this.blockMap[key] = entries;
      });
    });
  }

  getModulesByBlock(block: TimeBlock, day: string): { moduleCode: string; classVenue?: string }[] {
    const key = `${block.startTime}-${block.endTime}-${day}`;
    return this.blockMap[key] || [];
  }

  getMaxEntriesForBlock(block: TimeBlock): number {
    return Math.max(
      ...this.weekdays.map(day => this.getModulesByBlock(block, day).length),
      1
    );
  }

  getColorForModule(moduleCode: string): string {
    const colors = [
      '#e3f2fd', '#e8f5e9', '#fff3e0', '#fce4ec',
      '#ede7f6', '#f3e5f5', '#f9fbe7', '#e0f7fa',
      '#ffe0b2', '#c8e6c9', '#d1c4e9', '#b2ebf2'
    ];

    const hash = moduleCode
      .toUpperCase()
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return colors[hash % colors.length];
  }

  downloadScheduleAsPdf(): void {
    const content = document.getElementById('pdfContent');
    if (!content) return;

    html2pdf().set({
      margin: 0.5,
      filename: 'Class_Schedule.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    }).from(content).save();
  }

  formatTime(time: string): string {
    if (!time) return '-';
    const [hour, minute] = time.split(':');
    return `${hour}:${minute}`;
  }

}
