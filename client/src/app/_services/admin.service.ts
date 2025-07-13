import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User } from '../_models/user';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // ✅ Register a new user (Admin-only)
  registerUser(model: any) {
    return this.http.post<{ message: string }>(`${this.baseUrl}admin/register-user`, model);
  }

  // ✅ Get all users with modules and roles
  getAllUsers() {
    return this.http.get<User[]>(`${this.baseUrl}admin/all-users`);
  }

  // ✅ Get users by specific role
  getUsersByRole(role: string) {
    return this.http.get<User[]>(`${this.baseUrl}admin/users-by-role/${role}`);
  }

  // ✅ Get users who are not assigned to any modules
  getUsersWithNoModules() {
    return this.http.get<User[]>(`${this.baseUrl}admin/users-with-no-modules`);
  }

  // ✅ Update modules assigned to user
  updateUserModules(userNumber: string, semester1ModuleIds: number[], semester2ModuleIds: number[]) {
    return this.http.put(`${this.baseUrl}admin/update-modules/${userNumber}`, {
      semester1ModuleIds,
      semester2ModuleIds
    });
  }

  // ✅ Delete a user by userNumber
  deleteUser(userNumber: string) {
    return this.http.delete(`${this.baseUrl}admin/delete-user/${userNumber}`);
  }

  // ✅ Get users and their role claims (for role editing modal)
  getUserWithRoles() {
    return this.http.get<User[]>(`${this.baseUrl}admin/users-with-roles`);
  }

  // ✅ Update user roles
  updateUserRoles(userNumber: string, roles: string[]) {
    return this.http.put(`${this.baseUrl}admin/update-roles/${userNumber}`, roles);
  }

  // ✅ NEW: Update full user (name, email, password, roles)
  updateUser(userNumber: string, model: {
    firstName: string;
    lastName: string;
    email: string;
    updatePassword?: string;
    roles: string[];
  }) {
    return this.http.put(`${this.baseUrl}admin/update-user/${userNumber}`, model);
  }
}
