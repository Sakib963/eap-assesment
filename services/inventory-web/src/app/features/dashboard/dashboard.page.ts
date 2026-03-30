import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
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

  protected readonly title = signal('Smart Inventory & Order Management');
  protected readonly healthStatus = signal('Checking backend...');
  protected readonly databaseStatus = signal('Checking database...');

  constructor() {
    this.refreshHealth();
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
}
