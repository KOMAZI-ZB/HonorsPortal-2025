import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../_models/notification';
import { NotificationService } from '../_services/notification.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { CreateNotificationModalComponent } from '../modals/create-notification-modal/create-notification-modal.component';
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
  filtered: Notification[] = [];
  pagination: Pagination | null = null;
  pageNumber = 1;
  pageSize = 10;
  bsModalRef?: BsModalRef;
  currentUserRole: string = '';
  currentUserName: string = '';

  typeFilter: string = '';
  readFilter: '' | 'read' | 'unread' = '';

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
      .getPaginatedNotifications(this.pageNumber, this.pageSize, this.typeFilter, this.readFilter)
      .subscribe({
        next: response => {
          const items = response.body ?? [];
          this.pagination = JSON.parse(response.headers.get('Pagination')!);

          this.notifications = [...items].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          this.applyFilters();
        },
        error: err => console.error(err)
      });
  }

  applyFilters() {
    let list = [...this.notifications];

    if (this.readFilter === 'read') list = list.filter(x => !!x.isRead);
    else if (this.readFilter === 'unread') list = list.filter(x => !x.isRead);

    this.filtered = list;
  }

  onTypeFilterChanged() {
    this.pageNumber = 1;
    this.loadNotifications();
  }

  onReadFilterChanged() {
    this.pageNumber = 1;
    this.loadNotifications();
  }

  pageChanged(newPage: number) {
    this.pageNumber = newPage;
    this.loadNotifications();
  }

  openPostModal() {
    this.bsModalRef = this.modalService.show(CreateNotificationModalComponent, {
      class: 'modal-lg'
    });
    this.bsModalRef.onHidden?.subscribe(() => this.loadNotifications());
  }

  formatBadgeLabel(type: string): string {
    const t = (type || '').toLowerCase();
    const readable = (type || '').replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
    const isAnnouncement = t === 'general' || t === 'system';
    return isAnnouncement ? `${readable} ANNOUNCEMENT` : `${readable} NOTIFICATION`;
  }

  formatAudience(audience?: string | null): string {
    const key = (audience || '').toLowerCase();
    switch (key) {
      case 'all': return 'All users';
      case 'students': return 'Students';
      case 'staff': return 'Staff';
      case 'modulestudents': return 'Module students';
      case 'yearmodulestudents': return 'Year-module students';
      default: return audience || 'All users';
    }
  }

  markAsRead(a: Notification) {
    if (a.isRead) return;
    this.notificationService.markAsRead(a.id).subscribe({
      next: () => { a.isRead = true; this.applyFilters(); },
      error: err => console.error(err)
    });
  }

  // 🔁 now persisted via backend
  markAsUnread(a: Notification) {
    if (!a.isRead) return;
    this.notificationService.markAsUnread(a.id).subscribe({
      next: () => { a.isRead = false; this.applyFilters(); },
      error: err => console.error(err)
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
}
