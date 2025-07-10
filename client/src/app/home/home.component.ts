import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../_services/account.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, FormsModule]
})
export class HomeComponent {
  private accountService = inject(AccountService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  model: any = {};
  showPassword = false;

  login() {
    this.accountService.login(this.model).subscribe({
      next: () => {
        const role = this.accountService.getUserRole();
        if (role === 'Admin') {
          this.router.navigateByUrl('/admin');
        } else {
          this.router.navigateByUrl('/announcements');
        }
      },
      error: error => {
        this.toastr.error(error.error || 'Login failed');
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
