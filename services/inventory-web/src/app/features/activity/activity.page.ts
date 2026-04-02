import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { OrdersService } from '../../core/services/orders.service';
import type { ActivityLogEntry } from '../../core/models/orders.model';

@Component({
  selector: 'app-activity-page',
  standalone: true,
  imports: [NzCardModule, NzTimelineModule, NzSpinModule],
  templateUrl: './activity.page.html',
  styleUrl: './activity.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPage implements OnInit {
  private readonly ordersService = inject(OrdersService);

  protected readonly loading = signal(true);
  protected readonly activities = signal<ActivityLogEntry[]>([]);

  ngOnInit(): void {
    this.ordersService.getActivityLogs(10).subscribe({
      next: (logs) => {
        this.activities.set(logs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  protected formatTime(isoString: string): string {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
}
