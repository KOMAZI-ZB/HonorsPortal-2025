import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from '../../_services/repository.service';
import { CommonModule } from '@angular/common';
import { Repository } from '../../_models/repository';

@Component({
  standalone: true,
  selector: 'app-add-repository-modal',
  templateUrl: './add-repository-modal.component.html',
  styleUrls: ['./add-repository-modal.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class AddRepositoryModalComponent {
  form: FormGroup;
  imageFile: File | null = null;

  // ✅ Emit event after successful add
  @Output() onAdd = new EventEmitter<void>();

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
    private repoService: RepositoryService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      label: ['', Validators.required],
      linkUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]]
    });
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.imageFile = fileInput.files[0];
    } else {
      this.imageFile = null;
    }
  }

  submit() {
    if (this.form.invalid) return;

    const repo: Repository = {
      id: 0, // placeholder, backend assigns real ID
      label: this.form.get('label')?.value,
      linkUrl: this.form.get('linkUrl')?.value,
      image: this.imageFile || undefined // pass image only if selected
    };

    const useDefault = !this.imageFile;

    this.repoService.addExternalRepository(repo, useDefault).subscribe({
      next: () => {
        this.toastr.success('External repository added successfully.');
        this.onAdd.emit(); // ✅ Trigger reload on parent component
        this.bsModalRef.hide();
      },
      error: () => {
        this.toastr.error('Failed to add external repository.');
      }
    });
  }

  cancel() {
    this.bsModalRef.hide();
  }
}
