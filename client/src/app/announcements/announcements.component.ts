import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Announcement } from '../_models/announcement';
import { AnnouncementService } from '../_services/announcement.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { CreateAnnouncementModalComponent } from '../modals/create-announcement-modal/create-announcement-modal.component';
import { ConfirmDeleteModalComponent } from '../modals/confirm-delete-modal/confirm-delete-modal.component';
import { AccountService } from '../_services/account.service';
import { Pagination } from '../_models/pagination';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // 🆕 For filtering
  typeFilter: string = '';

  // 🆕 For modal image preview
  selectedImageUrl: string | null = null;
  showImageModal: boolean = false;

  constructor(
    private announcementService: AnnouncementService,
    private modalService: BsModalService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    const user = this.accountService.currentUser();
    this.currentUserNumber = user?.userNumber || '';
    this.currentUserRole = this.accountService.getUserRole();
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.announcementService
      .getPaginatedAnnouncements(
        this.pageNumber,
        this.pageSize,
        this.typeFilter
      )
      .subscribe({
        next: response => {
          this.announcements = response.body ?? [];
          this.pagination = JSON.parse(response.headers.get('Pagination')!);
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

  openImageModal(imageUrl: string) {
    this.selectedImageUrl = imageUrl;
    this.showImageModal = true;
  }

  closeImageModal() {
    this.selectedImageUrl = null;
    this.showImageModal = false;
  }

  // ✅ Badge label formatter (used in template only)
  formatBadgeLabel(type: string): string {
    const readable = type.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
    const isAnnouncement = type.toLowerCase() === 'general' || type.toLowerCase() === 'system';
    return isAnnouncement ? `${readable} ANNOUNCEMENT` : `${readable} NOTIFICATION`;
  }
}
