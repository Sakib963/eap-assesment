import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [NzButtonModule, NzCardModule, NzTagModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly healthService = inject(HealthService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly title = signal('Smart Inventory & Order Management');
  protected readonly healthStatus = signal('Checking backend...');
  protected readonly databaseStatus = signal('Checking database...');
  protected readonly currentUserEmail = signal('Loading user...');

  constructor() {
    this.refreshHealth();
    this.loadMe();
  }

  protected refreshHealth(): void {
    this.healthService.getHealth().subscribe({
      next: (response) => {
        this.healthStatus.set(`Backend ${response.service}: ${response.status}`);
        this.databaseStatus.set(`Database: ${response.database?.status ?? 'unknown'}`);
      },
      error: () => {
        this.healthStatus.set('Backend unreachable. Verify API server is running.');
        this.databaseStatus.set('Database: unavailable');
      },
    });
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth/login');
  }

  private loadMe(): void {
    this.authService.me().subscribe({
      next: (user) => {
        this.currentUserEmail.set(user?.email ?? 'Unknown user');
      },
      error: () => {
        this.currentUserEmail.set('Session expired');
      },
    });
  }
}
