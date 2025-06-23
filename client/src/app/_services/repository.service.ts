import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Repository } from '../_models/repository';
import { setPaginationHeaders } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {
  private baseUrl = environment.apiUrl + 'repository';

  constructor(private http: HttpClient) { }

  // ✅ Get external academic repositories (paginated)
  getExternalRepositories(pageNumber: number, pageSize: number): Observable<HttpResponse<Repository[]>> {
    const params = setPaginationHeaders(pageNumber, pageSize);
    return this.http.get<Repository[]>(`${this.baseUrl}/external`, {
      observe: 'response',
      params
    });
  }

  // ✅ Add a new external repository (Admin/Coordinator only)
  addExternalRepository(repo: Repository): Observable<Repository> {
    return this.http.post<Repository>(`${this.baseUrl}/external`, repo);
  }

  // ✅ Delete an external repository by ID (Admin/Coordinator only)
  deleteExternalRepository(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/external/${id}`);
  }
}
