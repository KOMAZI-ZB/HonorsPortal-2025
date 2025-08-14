import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Notification } from '../_models/notification';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { setPaginationHeaders } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ✅ Get paginated notifications (with optional filters)
  getPaginatedNotifications(
    pageNumber: number,
    pageSize: number,
    typeFilter: string = ''
  ): Observable<HttpResponse<Notification[]>> {
    let params = setPaginationHeaders(pageNumber, pageSize);

    if (typeFilter) {
      params = params.append('TypeFilter', typeFilter);
    }

    return this.http.get<Notification[]>(`${this.baseUrl}notifications`, {
      observe: 'response',
      params
    });
  }

  // ✅ Create a new notification (manual or system-triggered)
  create(formData: FormData): Observable<Notification> {
    return this.http.post<Notification>(`${this.baseUrl}notifications`, formData);
  }

  // ✅ Delete an notification by ID
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}notifications/${id}`);
  }

  // ✅ Used internally by other features to auto-create system notifications
  //    Optional audience support (e.g., 'ModuleStudents' for DocumentUpload)
  createFromSystem(data: {
    type: string;
    title: string;
    message: string;
    moduleId?: number | null;
    audience?: string; // optional
  }): Observable<Notification> {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    formData.append('message', data.message);
    if (data.moduleId !== undefined && data.moduleId !== null) {
      formData.append('moduleId', data.moduleId.toString());
    }
    if (data.audience) {
      formData.append('audience', data.audience);
    }
    return this.create(formData);
  }

  // 🆕 Mark as read
  markAsRead(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}notifications/${id}/read`, {});
    // server is idempotent; safe to call multiple times
  }
}
