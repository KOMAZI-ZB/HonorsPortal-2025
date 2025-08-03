import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // ✅ Added Router
import { CommonModule } from '@angular/common';
import { DocumentService } from '../_services/document.service';
import { Document } from '../_models/document';
import { UploadDocumentModalComponent } from '../modals/upload-document-modal/upload-document-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AccountService } from '../_services/account.service';
import { Pagination } from '../_models/pagination';

@Component({
  selector: 'app-module-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-documents.component.html',
  styleUrls: ['./module-documents.component.css']
})
export class ModuleDocumentsComponent implements OnInit {
  moduleId!: number;
  documents: Document[] = [];
  bsModalRef?: BsModalRef;
  roles: string[] = [];

  pagination: Pagination = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0,
    totalPages: 0
  };

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService,
    private modalService: BsModalService,
    private accountService: AccountService,
    private router: Router // ✅ Inject Router
  ) { }

  ngOnInit(): void {
    this.roles = this.accountService.roles();
    this.moduleId = +this.route.snapshot.paramMap.get('id')!;
    this.loadDocuments();
  }

  loadDocuments() {
    this.documentService
      .getDocumentsByModulePaged(this.moduleId, this.pagination.currentPage, this.pagination.itemsPerPage)
      .subscribe({
        next: (response) => {
          this.documents = response.body || [];
          const paginationHeader = response.headers.get('Pagination');
          if (paginationHeader) {
            this.pagination = JSON.parse(paginationHeader);
          }
        },
        error: (err) => console.error('Failed to load documents', err)
      });
  }

  pageChanged(event: any): void {
    this.pagination.currentPage = event.page;
    this.loadDocuments();
  }

  openUploadModal() {
    this.bsModalRef = this.modalService.show(UploadDocumentModalComponent);

    setTimeout(() => {
      if (this.bsModalRef?.content) {
        this.bsModalRef.content.formData = {
          source: 'Module',
          moduleId: this.moduleId
        };

        this.bsModalRef.content.onUpload.subscribe(() => {
          this.loadDocuments();
        });
      }
    }, 0);
  }

  deleteDocument(docId: number) {
    this.documentService.deleteModuleDocument(docId).subscribe({
      next: () => {
        this.documents = this.documents.filter((d) => d.id !== docId);
      },
      error: (err) => console.error('Failed to delete document', err)
    });
  }

  hasUploadRights(): boolean {
    return (
      this.roles.includes('Lecturer') ||
      this.roles.includes('Coordinator') ||
      this.roles.includes('Admin')
    );
  }

  goBack(): void {
    this.router.navigate(['/modules']); // ✅ Navigation logic
  }
}
