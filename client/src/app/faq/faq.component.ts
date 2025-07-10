import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaqService } from '../_services/faq.service';
import { FaqEntry } from '../_models/faq-entry';
import { ToastrService } from 'ngx-toastr';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AccountService } from '../_services/account.service';
import { FaqModalComponent } from '../modals/faq-modal/faq-modal.component';
import { ConfirmDeleteModalComponent } from '../modals/confirm-delete-modal/confirm-delete-modal.component';
import { RouterModule } from '@angular/router';
import { Pagination } from '../_models/pagination';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent implements OnInit {
  faqs: FaqEntry[] = [];
  pagination: Pagination | null = null;
  pageNumber = 1;
  pageSize = 6;
  bsModalRef?: BsModalRef;
  userRole: string = '';
  openFaqId: number | null = null;

  constructor(
    private faqService: FaqService,
    private toastr: ToastrService,
    private modalService: BsModalService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.userRole = this.accountService.getUserRole();
    this.loadFaqs();
  }

  loadFaqs() {
    this.faqService.getAllFaqs({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize
    }).subscribe({
      next: response => {
        this.faqs = response.body ?? [];
        const paginationHeader = response.headers.get('Pagination');
        if (paginationHeader) {
          this.pagination = JSON.parse(paginationHeader);
        }
      },
      error: () => this.toastr.error('Failed to load FAQs')
    });
  }

  pageChanged(newPage: number) {
    this.pageNumber = newPage;
    this.loadFaqs();
  }

  openEditModal(faq?: FaqEntry) {
    const initialState = faq
      ? { faq, mode: 'edit' as const }
      : { mode: 'create' as const };

    this.bsModalRef = this.modalService.show(FaqModalComponent, { initialState });

    this.bsModalRef.onHidden?.subscribe(() => {
      this.loadFaqs();
    });
  }

  deleteFaq(id: number) {
    const initialState = {
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this FAQ entry?',
      onConfirm: () => {
        this.faqService.deleteFaq(id).subscribe({
          next: () => {
            this.toastr.success('FAQ deleted');
            this.loadFaqs();
          },
          error: () => this.toastr.error('Failed to delete FAQ')
        });
      }
    };

    this.bsModalRef = this.modalService.show(ConfirmDeleteModalComponent, { initialState });
  }

  toggleFaq(id: number) {
    this.openFaqId = this.openFaqId === id ? null : id;
  }

  canEdit(): boolean {
    return ['Admin', 'Lecturer', 'Coordinator'].includes(this.userRole);
  }

  canDelete(): boolean {
    return this.userRole === 'Admin';
  }
}
