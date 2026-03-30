import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly http = inject(HttpClient);
  protected readonly title = signal('Smart Inventory & Order Management');
  protected readonly healthStatus = signal('Checking backend...');

  constructor() {
    this.http
      .get<{ status: string; service: string }>(`${environment.apiBaseUrl}/api/health`)
      .subscribe({
        next: (response) => {
          this.healthStatus.set(`Backend ${response.service}: ${response.status}`);
        },
        error: () => {
          this.healthStatus.set('Backend unreachable. Start backend on port 3000.');
        },
      });
  }
}
