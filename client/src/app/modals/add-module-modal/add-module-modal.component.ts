import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-add-module-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-module-modal.component.html',
  styleUrls: ['./add-module-modal.component.css']
})
export class AddModuleModalComponent {
  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    public modalRef: BsModalRef
  ) { }

  baseUrl = environment.apiUrl;

  moduleCode = '';
  moduleName = '';
  semester = 1;
  classVenue = '';

  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  selectedDays: { [key: string]: boolean } = {};
  startTimes: { [key: string]: string } = {};
  endTimes: { [key: string]: string } = {};

  test1Venue = '';
  test1Date = '';
  test1Time = '';

  test2Venue = '';
  test2Date = '';
  test2Time = '';

  supplementaryVenue = '';
  supplementaryDate = '';
  supplementaryTime = '';

  submit() {
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

    const payload = {
      moduleCode: this.moduleCode,
      moduleName: this.moduleName,
      semester: this.semester,
      classVenue: this.classVenue || null,

      weekDays: chosenDays,              // ✅ Pass as array
      startTimes: starts,                // ✅ Pass as array
      endTimes: ends,                    // ✅ Pass as array

      test1Venue: this.test1Venue || null,
      test1Date: this.test1Date || null,
      test1Time: this.test1Time || null,
      test2Venue: this.test2Venue || null,
      test2Date: this.test2Date || null,
      test2Time: this.test2Time || null,
      supplementaryVenue: this.supplementaryVenue || null,
      supplementaryDate: this.supplementaryDate || null,
      supplementaryTime: this.supplementaryTime || null
    };

    this.http.post(this.baseUrl + 'modules', payload).subscribe({
      next: () => {
        this.toastr.success('Module added successfully');
        this.modalRef.hide();
      },
      error: err => {
        this.toastr.error('Failed to add module');
        console.error(err);
      }
    });
  }


  cancel() {
    this.modalRef.hide();
  }
}
