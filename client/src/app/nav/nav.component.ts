import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../_services/account.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ToastrService } from 'ngx-toastr';
import { HasRoleDirective } from '../_directives/has-role.directive';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [
    FormsModule,
    BsDropdownModule,
    RouterLink,
    RouterLinkActive,
    HasRoleDirective,
    NgIf
  ],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent implements OnInit {
  accountService = inject(AccountService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  model: any = {};
  hasNewAnnouncement = false;

  ngOnInit() {
    const seen = localStorage.getItem('announcementsSeen');
    this.hasNewAnnouncement = seen !== 'true';
  }

  login() {
    this.accountService.login(this.model).subscribe({
      next: () => {
        const role = this.accountService.getUserRole();
        if (role === 'Admin') {
          this.router.navigateByUrl('/admin');
        } else {
          this.router.navigateByUrl('/announcements');
        }
      },
      error: error => {
        this.toastr.error(error.error || 'Login failed');
      }
    });
  }

  logout() {
    this.accountService.logout();
    this.router.navigateByUrl('/');
  }

  markAnnouncementsAsSeen() {
    this.hasNewAnnouncement = false;
    localStorage.setItem('announcementsSeen', 'true');
    localStorage.setItem('lastSeenAnnouncement', new Date().toISOString());
  }

  get showLecturerPanel(): boolean {
    const user = this.accountService.currentUser();
    const roles = this.accountService.roles();
    const hasRole = roles.includes('Lecturer') || roles.includes('Coordinator');
    const hasModules = (user?.modules ?? []).length > 0;
    return hasRole && hasModules;
  }

  isAdmin(): boolean {
    return this.accountService.getUserRole() === 'Admin';
  }
}
