import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { HasRoleDirective } from '../_directives/has-role.directive';
import { NgIf, NgClass } from '@angular/common'; // <-- add NgClass
import { AccountService } from '../_services/account.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [
    BsDropdownModule,
    RouterLink,
    RouterLinkActive,
    HasRoleDirective,
    NgIf,
    NgClass // <-- add NgClass
  ],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  accountService = inject(AccountService);
  private router = inject(Router);

  hasNewAnnouncement = false;

  ngOnInit() {
    const seen = localStorage.getItem('announcementsSeen');
    this.hasNewAnnouncement = seen !== 'true';
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
