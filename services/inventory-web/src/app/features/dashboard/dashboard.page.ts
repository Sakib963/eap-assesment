import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';
import type { DashboardMetrics } from '../../core/models/orders.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [NzCardModule, NzGridModule, NzStatisticModule, NzTableModule, NzTagModule, NzSpinModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly ordersService = inject(OrdersService);

  protected readonly title = signal('Inventory Control Center');
  protected readonly loading = signal(true);
  protected readonly metrics = signal<DashboardMetrics | null>(null);

  protected readonly currentUserEmail = computed(() => {
    return this.authService.user()?.email ?? 'Anonymous';
  });

  protected readonly currentUserRole = computed(() => {
    const role = this.authService.user()?.role;
    if (!role) return 'Unknown';
    return role === 'manager' ? 'Manager' : 'Salesman';
  });

  protected readonly stats = computed(() => {
    const m = this.metrics();
    if (!m) return [];
    return [
      { label: 'Orders Today', value: m.orders_today, suffix: '' },
      { label: 'Pending Orders', value: m.pending_orders, suffix: '' },
      { label: 'Low Stock Items', value: m.low_stock_count, suffix: '' },
      { label: 'Revenue Today', value: m.revenue_today.toFixed(2), suffix: '$' },
    ];
  });

  protected readonly attentionItems = computed(() => {
    const m = this.metrics();
    if (!m) return [];
    return m.low_stock_products.map((p) => ({
      item: p.name,
      note: p.current_stock <= 0 ? 'Stock depleted' : `${p.current_stock} left (below threshold of ${p.min_stock_threshold})`,
      priority: p.status === 'out_of_stock' ? 'high' : 'medium',
    }));
  });

  ngOnInit(): void {
    this.ordersService.getDashboard().subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
