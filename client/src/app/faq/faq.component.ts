import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FaqService } from '../_services/faq.service';
import { FaqEntry } from '../_models/faq-entry';
import { ToastrService } from 'ngx-toastr';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AccountService } from '../_services/account.service';
import { FaqModalComponent } from '../modals/faq-modal/faq-modal.component';
import { ConfirmDeleteModalComponent } from '../modals/confirm-delete-modal/confirm-delete-modal.component';
import { Pagination } from '../_models/pagination';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent implements OnInit {
  faqs: FaqEntry[] = [];
  filteredFaqs: FaqEntry[] = [];

  pagination: Pagination | null = null;
  pageNumber = 1;
  pageSize = 10;

  bsModalRef?: BsModalRef;
  userRole: string = '';
  openFaqId: number | null = null;

  // 🔎 search
  searchTerm = '';

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
        this.applyFilter();

        const paginationHeader = response.headers.get('Pagination');
        if (paginationHeader) {
          this.pagination = JSON.parse(paginationHeader);
        }
      },
      error: () => this.toastr.error('Failed to load FAQs')
    });
  }

  // pagination
  pageChanged(newPage: number) {
    if (!this.pagination) return;
    if (newPage < 1 || newPage > this.pagination.totalPages) return;
    this.pageNumber = newPage;
    this.loadFaqs();
  }

  // modal: create / edit
  openEditModal(faq?: FaqEntry) {
    const initialState = faq
      ? { faq, mode: 'edit' as const }
      : { mode: 'create' as const };

    this.bsModalRef = this.modalService.show(FaqModalComponent, { initialState });

    this.bsModalRef.onHidden?.subscribe(() => {
      this.loadFaqs();
    });
  }

  // delete with confirm
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

  // accordion toggle
  toggleFaq(id: number) {
    this.openFaqId = this.openFaqId === id ? null : id;
  }

  isAdmin(): boolean {
    return this.userRole === 'Admin';
  }

  // 🔎 search helpers
  onSearchChange() {
    this.applyFilter();
    // keep the open item visible after a filter change
    if (this.openFaqId && !this.filteredFaqs.some(f => f.id === this.openFaqId)) {
      this.openFaqId = null;
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  private applyFilter() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredFaqs = [...this.faqs];
      return;
    }

    // Match against question, answer, and common optional “name/author” fields if they exist
    this.filteredFaqs = this.faqs.filter(f => {
      const haystack = [
        f.question ?? '',
        f.answer ?? '',
        // optional fields (won't throw if absent)
        (f as any).createdByName ?? '',
        (f as any).authorName ?? '',
        (f as any).createdBy ?? '',
        (f as any).author ?? ''
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }
}
