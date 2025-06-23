import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from '../../_services/repository.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-add-repository-modal',
  templateUrl: './add-repository-modal.component.html',
  styleUrls: ['./add-repository-modal.component.css']
})
export class AddRepositoryModalComponent {
  form: FormGroup;

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
    private repoService: RepositoryService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      label: ['', Validators.required],
      imageUrl: [''], // Optional field (default applied if empty)
      linkUrl: ['', [Validators.required, Validators.pattern('https?://.+')]]
    });
  }

  submit() {
    if (this.form.invalid) return;

    const newRepo = this.form.value;

    // ✅ Apply default image if none provided
    if (!newRepo.imageUrl || newRepo.imageUrl.trim() === '') {
      newRepo.imageUrl = '/assets/database.png';
    }

    this.repoService.addExternalRepository(newRepo).subscribe({
      next: () => {
        this.toastr.success('Repository added.');
        this.bsModalRef.hide();
      },
      error: () => {
        this.toastr.error('Failed to add repository.');
      }
    });
  }

  cancel() {
    this.bsModalRef.hide();
  }
}
