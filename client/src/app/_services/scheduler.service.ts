import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ClassSchedule } from '../_models/class-schedule';
import { TestSchedule } from '../_models/test-schedule';

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  private baseUrl = environment.apiUrl + 'scheduler/';

  constructor(private http: HttpClient) { }

  // ✅ Get personalized class timetable for the current user
  getClassSchedule(semester: number): Observable<ClassSchedule[]> {
    return this.http.get<ClassSchedule[]>(`${this.baseUrl}class/${semester}`);
  }

  // ✅ Get personalized test timetable for the current user
  getTestSchedule(semester: number): Observable<TestSchedule[]> {
    return this.http.get<TestSchedule[]>(`${this.baseUrl}test/${semester}`);
  }

  // 🔒 Additional endpoints like exam timetable or lab booking are handled in LabbookingService
}
