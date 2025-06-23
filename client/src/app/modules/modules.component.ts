import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { Module } from '../_models/module';
import { AccountService } from '../_services/account.service';

@Component({
  selector: 'app-modules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.css']
})
export class ModulesComponent implements OnInit {
  modules: Module[] = [];
  selectedSemester = 1;
  roles: string[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.roles = this.accountService.roles();
    this.loadModules();
  }

  loadModules() {
    this.http
      .get<Module[]>(`${environment.apiUrl}modules/semester/${this.selectedSemester}`)
      .subscribe({
        next: (modules) => (this.modules = modules),
        error: (err) => console.error('Failed to load modules', err)
      });
  }

  onSemesterChange() {
    this.loadModules();
  }

  openModule(module: Module) {
    this.router.navigate(['/modules', module.id]);
  }
}
