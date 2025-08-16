import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../_models/notification';
import { NotificationService } from '../_services/notification.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { CreateNotificationModalComponent } from '../modals/create-notification-modal/create-notification-modal.component';
import { ConfirmDeleteModalComponent } from '../modals/confirm-delete-modal/confirm-delete-modal.component';
import { AccountService } from '../_services/account.service';
import { Pagination } from '../_models/pagination';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  pagination: Pagination | null = null;
  pageNumber = 1;
  pageSize = 10;
  bsModalRef?: BsModalRef;
  currentUserRole: string = '';
  currentUserName: string = '';

  // 🔹 announcements | notifications | ''(all)
  typeFilter: string = '';

  // image modal
  selectedImageUrl: string | null = null;
  showImageModal: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private modalService: BsModalService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    const user = this.accountService.currentUser();
    this.currentUserName = user?.userName || '';
    this.currentUserRole = this.accountService.getUserRole();
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationService
      .getPaginatedNotifications(this.pageNumber, this.pageSize, this.typeFilter)
      .subscribe({
        next: response => {
          this.notifications = response.body ?? [];
          this.pagination = JSON.parse(response.headers.get('Pagination')!);
        },
        error: err => console.error(err)
      });
  }

  pageChanged(newPage: number) {
    this.pageNumber = newPage;
    this.loadNotifications();
  }

  openPostModal() {
    // Still uses the same component; it now says "Announcement"
    this.bsModalRef = this.modalService.show(CreateNotificationModalComponent, {
      class: 'modal-lg'
    });
    this.bsModalRef.onHidden?.subscribe(() => this.loadNotifications());
  }

  canDelete(notification: Notification): boolean {
    return (
      notification.createdBy === this.currentUserName &&
      (this.currentUserRole === 'Admin' ||
        this.currentUserRole === 'Lecturer' ||
        this.currentUserRole === 'Coordinator')
    );
  }

  deleteNotification(id: number) {
    this.bsModalRef = this.modalService.show(ConfirmDeleteModalComponent, {
      class: 'modal-sm',
      initialState: {
        onConfirm: () => {
          this.notificationService.delete(id).subscribe({
            next: () => this.loadNotifications(),
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

  // 🔹 Badge label: General/System → ANNOUNCEMENT; others → NOTIFICATION
  formatBadgeLabel(type: string): string {
    const t = (type || '').toLowerCase();
    const readable = (type || '').replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
    const isAnnouncement = t === 'general' || t === 'system';
    return isAnnouncement ? `${readable} ANNOUNCEMENT` : `${readable} NOTIFICATION`;
  }

  markAsRead(a: Notification) {
    if (a.isRead) return;
    this.notificationService.markAsRead(a.id).subscribe({
      next: () => (a.isRead = true),
      error: err => console.error(err)
    });
  }
}
