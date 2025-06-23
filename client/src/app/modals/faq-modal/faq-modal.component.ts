import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormsModule } from '@angular/forms';
import { FaqEntry } from '../../_models/faq-entry';
import { FaqService } from '../../_services/faq.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-faq-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faq-modal.component.html',
  styleUrls: ['./faq-modal.component.css']
})
export class FaqModalComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() faq?: FaqEntry;

  question: string = '';
  answer: string = '';

  constructor(
    public bsModalRef: BsModalRef<FaqModalComponent>,
    private faqService: FaqService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    if (this.mode === 'edit' && this.faq) {
      this.question = this.faq.question;
      this.answer = this.faq.answer;
    }
  }

  close() {
    this.bsModalRef.hide();
  }

  submit() {
    if (!this.question.trim() || !this.answer.trim()) {
      this.toastr.error('Both question and answer are required.');
      return;
    }

    const faqData = { question: this.question, answer: this.answer };

    if (this.mode === 'edit' && this.faq) {
      this.faqService.updateFaq(this.faq.id, faqData).subscribe({
        next: () => {
          this.toastr.success('FAQ updated successfully.');
          this.close();
        },
        error: () => this.toastr.error('Failed to update FAQ.')
      });
    } else if (this.mode === 'create') {
      this.faqService.createFaq(faqData).subscribe({
        next: () => {
          this.toastr.success('FAQ created successfully.');
          this.close();
        },
        error: () => this.toastr.error('Failed to create FAQ.')
      });
    }
  }
}
