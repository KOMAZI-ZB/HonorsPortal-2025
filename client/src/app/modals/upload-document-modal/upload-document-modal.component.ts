import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DocumentService } from '../../_services/document.service';
import { AnnouncementService } from '../../_services/announcement.service';
import { ToastrService } from 'ngx-toastr';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-upload-document-modal',
  standalone: true,
  templateUrl: './upload-document-modal.component.html',
  styleUrls: ['./upload-document-modal.component.css'],
  imports: [ReactiveFormsModule, NgIf, NgClass]
})
export class UploadDocumentModalComponent implements OnInit, OnChanges {
  @Input() formData!: { source: 'Module' | 'Repository'; moduleId: number | null };
  @Output() onUpload = new EventEmitter<void>();

  uploadForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
    private announcementService: AnnouncementService,
    private toastr: ToastrService,
    public bsModalRef: BsModalRef
  ) {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      file: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('Upload Modal Initialized');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formData'] && this.formData) {
      console.log('Modal Received formData (via ngOnChanges):', this.formData);

      if (
        this.formData.source === 'Module' &&
        (!this.formData.moduleId || this.formData.moduleId <= 0)
      ) {
        this.toastr.error('Upload failed: no module selected.');
        this.bsModalRef.hide();
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.uploadForm.get('file')?.setValue(file);
    }
  }

  upload() {
    if (this.uploadForm.invalid) {
      this.toastr.error('Please fill in all required fields.');
      return;
    }

    const { title, file } = this.uploadForm.value;
    const { source, moduleId } = this.formData;

    console.log('Uploading document with moduleId:', moduleId);

    if (source === 'Module' && (!moduleId || moduleId <= 0)) {
      this.toastr.error('Upload failed: no module selected.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    formData.append('source', source);
    if (source === 'Module') {
      formData.append('moduleId', moduleId!.toString());
    }

    const request$ =
      source === 'Module'
        ? this.documentService.uploadModuleDocument(formData)
        : this.documentService.uploadRepositoryDocument(formData);

    request$.subscribe({
      next: () => {
        this.toastr.success('Document uploaded successfully.');
        this.onUpload.emit();
        this.bsModalRef.hide();
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.toastr.error(err?.error || 'Upload failed. Please try again.');
      }
    });
  }
}
