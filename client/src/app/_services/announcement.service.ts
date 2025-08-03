import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Announcement } from '../_models/announcement';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { setPaginationHeaders } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ✅ Get paginated announcements (with optional filters)
  getPaginatedAnnouncements(
    pageNumber: number,
    pageSize: number,
    typeFilter: string = ''
  ): Observable<HttpResponse<Announcement[]>> {
    let params = setPaginationHeaders(pageNumber, pageSize); // ✅ Removed CurrentUserNumber

    if (typeFilter) {
      params = params.append('TypeFilter', typeFilter);
    }

    return this.http.get<Announcement[]>(`${this.baseUrl}announcements`, {
      observe: 'response',
      params
    });
  }

  // ✅ Create a new announcement (manual or system-triggered)
  create(formData: FormData): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.baseUrl}announcements`, formData);
  }

  // ✅ Delete an announcement by ID
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}announcements/${id}`);
  }

  // ✅ Used internally by other features to auto-create system announcements
  createFromSystem(data: {
    type: string;
    title: string;
    message: string;
    moduleId?: number | null;
  }): Observable<Announcement> {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    formData.append('message', data.message);
    if (data.moduleId !== undefined && data.moduleId !== null) {
      formData.append('moduleId', data.moduleId.toString());
    }
    return this.create(formData);
  }
}
