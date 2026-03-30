import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [NzButtonModule, NzCardModule, NzGridModule, NzStatisticModule, NzTableModule, NzTagModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly healthService = inject(HealthService);
  private readonly authService = inject(AuthService);

  protected readonly title = signal('Inventory Control Center');
  protected readonly healthStatus = signal('Checking backend...');
  protected readonly databaseStatus = signal('Checking database...');
  protected readonly currentUserEmail = signal('Loading user...');
  protected readonly stats = signal([
    { label: 'Orders Today', value: 3, suffix: '' },
    { label: 'Pending Orders', value: 2, suffix: '' },
    { label: 'Low Stock Items', value: 5, suffix: '' },
    { label: 'Revenue Today', value: 1389.95, suffix: '$' },
  ]);
  protected readonly attentionItems = signal([
    { item: 'Wireless Mouse', note: 'Below threshold by 17 units', priority: 'high' },
    { item: 'A4 Paper Ream', note: 'Stock depleted', priority: 'high' },
    { item: 'Desk Lamp', note: 'Restock this week', priority: 'medium' },
  ]);

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
