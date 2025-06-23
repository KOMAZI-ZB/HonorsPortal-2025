import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { User } from '../_models/user';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  currentUser = signal<User | null>(null);

  roles = computed(() => {
    const user = this.currentUser();
    if (!user?.token) return [];
    try {
      const payload = JSON.parse(atob(user.token.split('.')[1]));
      const extracted = payload.role || payload.roles || [];
      return Array.isArray(extracted) ? extracted : [extracted];
    } catch (e) {
      console.error('Failed to decode JWT roles:', e);
      return [];
    }
  });

  getUserRole(): string {
    const roles = this.roles();
    return roles.length > 0 ? roles[0] : '';
  }

  // ✅ Helper to check if user has modules (used for nav visibility)
  hasModules(): boolean {
    return (this.currentUser()?.modules ?? []).length > 0;
  }

  // ✅ Alternative naming if you want both available
  getUserHasModules(): boolean {
    return (this.currentUser()?.modules ?? []).length > 0;
  }

  login(model: any) {
    return this.http.post<User>(this.baseUrl + 'account/login', model).pipe(
      map(user => {
        if (user) this.setCurrentUser(user);
        return user;
      })
    );
  }

  register(model: any) {
    return this.http.post<{ message: string }>(this.baseUrl + 'account/register-user', model).pipe(
      map(response => {
        return response; // Do NOT set currentUser here
      })
    );
  }

  setCurrentUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  getAllUsers() {
    return this.http.get<User[]>(this.baseUrl + 'account/all-users');
  }

  getUsersByRole(role: string) {
    return this.http.get<User[]>(`${this.baseUrl}account/users-by-role/${role}`);
  }

  getUsersWithNoModules() {
    return this.http.get<User[]>(`${this.baseUrl}account/users-with-no-modules`);
  }

  updateRoles(userNumber: string, roles: string[]) {
    return this.http.put(`${this.baseUrl}account/update-roles/${userNumber}`, roles);
  }

  updateUserModules(userNumber: string, semester1Ids: number[], semester2Ids: number[]) {
    return this.http.put(`${this.baseUrl}account/users/${userNumber}/modules`, { semester1Ids, semester2Ids });
  }

  deleteUser(userNumber: string) {
    return this.http.delete(`${this.baseUrl}account/users/${userNumber}`);
  }
}
