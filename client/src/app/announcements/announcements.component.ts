import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Announcement } from '../_models/announcement';
import { AnnouncementService } from '../_services/announcement.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { CreateAnnouncementModalComponent } from '../modals/create-announcement-modal/create-announcement-modal.component';
import { ConfirmDeleteModalComponent } from '../modals/confirm-delete-modal/confirm-delete-modal.component';
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
  pageSize = 10;
  bsModalRef?: BsModalRef;
  currentUserRole: string = '';
  currentUserNumber: string = '';

  // 🆕 For modal image preview
  selectedImageUrl: string | null = null;
  showImageModal: boolean = false;

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

        // 🔕 Removed logic that sets 'announcementsSeen' flag to prevent 🔔 emoji
        // const latest = this.announcements[0]?.createdAt;
        // const lastSeen = localStorage.getItem('lastSeenAnnouncement');
        // if (!lastSeen || new Date(latest) > new Date(lastSeen)) {
        //   localStorage.setItem('announcementsSeen', 'false');
        // }
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
      // 🔕 Removed 'announcementsSeen' flag update
      // localStorage.setItem('announcementsSeen', 'false');
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
    this.bsModalRef = this.modalService.show(ConfirmDeleteModalComponent, {
      class: 'modal-sm',
      initialState: {
        onConfirm: () => {
          this.announcementService.delete(id).subscribe({
            next: () => this.loadAnnouncements(),
            error: err => console.error(err)
          });
        }
      }
    });
  }

  // 🆕 Image modal logic
  openImageModal(imageUrl: string) {
    this.selectedImageUrl = imageUrl;
    this.showImageModal = true;
  }

  closeImageModal() {
    this.selectedImageUrl = null;
    this.showImageModal = false;
  }
}
