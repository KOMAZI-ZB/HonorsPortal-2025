import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Announcement } from '../_models/announcement';
import { AnnouncementService } from '../_services/announcement.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { CreateAnnouncementModalComponent } from '../modals/create-announcement-modal/create-announcement-modal.component';
import { AccountService } from '../_services/account.service';
import { Pagination } from '../_models/pagination';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.css']
})
export class AnnouncementsComponent implements OnInit {
  announcements: Announcement[] = [];
  pagination: Pagination | null = null;
  pageNumber = 1;
  pageSize = 5;
  bsModalRef?: BsModalRef;
  currentUserRole: string = '';
  currentUserNumber: string = '';

  constructor(
    private announcementService: AnnouncementService,
    private modalService: BsModalService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.loadAnnouncements();
    const user = this.accountService.currentUser();
    this.currentUserNumber = user?.userNumber || '';
    this.currentUserRole = this.accountService.getUserRole();
  }

  loadAnnouncements() {
    this.announcementService.getPaginatedAnnouncements(this.pageNumber, this.pageSize).subscribe({
      next: response => {
        this.announcements = response.body ?? [];
        this.pagination = JSON.parse(response.headers.get('Pagination')!);

        const latest = this.announcements[0]?.createdAt;
        const lastSeen = localStorage.getItem('lastSeenAnnouncement');
        if (!lastSeen || new Date(latest) > new Date(lastSeen)) {
          localStorage.setItem('announcementsSeen', 'false');
        }
      },
      error: err => console.error(err)
    });
  }

  pageChanged(newPage: number) {
    this.pageNumber = newPage;
    this.loadAnnouncements();
  }

  openPostModal() {
    this.bsModalRef = this.modalService.show(CreateAnnouncementModalComponent, {
      class: 'modal-lg'
    });

    this.bsModalRef.onHidden?.subscribe(() => {
      this.loadAnnouncements();
      localStorage.setItem('announcementsSeen', 'false'); // 🔔 Set new flag
    });
  }

  canDelete(announcement: Announcement): boolean {
    return (
      announcement.createdBy === this.currentUserNumber &&
      (this.currentUserRole === 'Admin' ||
        this.currentUserRole === 'Lecturer' ||
        this.currentUserRole === 'Coordinator')
    );
  }

  deleteAnnouncement(id: number) {
    if (confirm('Are you sure you want to delete this announcement?')) {
      this.announcementService.delete(id).subscribe({
        next: () => this.loadAnnouncements(),
        error: err => console.error(err)
      });
    }
  }
}
