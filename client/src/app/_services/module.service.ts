import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Module } from '../_models/module';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModuleService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ✅ Admin: Get full list of all modules in system
  getAllModules(): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.baseUrl}modules`);
  }

  // ✅ Admin or Student: Get modules based on semester (uses role-aware backend logic)
  getModulesBySemester(semester: number): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.baseUrl}modules/semester/${semester}`);
  }

  // ✅ Admin: Add a new module (used in admin panel)
  addModule(moduleData: Partial<Module>): Observable<Module> {
    return this.http.post<Module>(`${this.baseUrl}modules`, moduleData);
  }

  // ✅ Admin: Update module details (class/test schedule updates)
  updateModule(id: number, moduleData: Partial<Module>): Observable<any> {
    return this.http.put(`${this.baseUrl}modules/${id}`, moduleData);
  }

  // ✅ Admin: Delete a module from the system
  deleteModule(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}modules/${id}`);
  }

  // ✅ Lecturer/Coordinator: Get list of modules assigned to them
  getAssignedModules(): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.baseUrl}modules/assigned`);
  }
}
