import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  computed,
  inject,
  signal,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';
import type { DashboardMetrics } from '../../core/models/orders.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    NzCardModule,
    NzGridModule,
    NzStatisticModule,
    NzTableModule,
    NzTagModule,
    NzSpinModule,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly ordersService = inject(OrdersService);

  private chartElement?: ElementRef<HTMLCanvasElement>;

  @ViewChild('revenueChart')
  set revenueChartCanvas(value: ElementRef<HTMLCanvasElement> | undefined) {
    this.chartElement = value;
    this.tryInitializeChart();
  }

  protected readonly title = signal('Inventory Control Center');
  protected readonly loading = signal(true);
  protected readonly metrics = signal<DashboardMetrics | null>(null);
  private chart: Chart | null = null;

  protected readonly isManager = computed(() => this.authService.user()?.role === 'manager');

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
      { label: 'Completed Orders', value: m.completed_orders, suffix: '' },
      { label: 'Low Stock Items', value: m.low_stock_count, suffix: '' },
      { label: 'Revenue Today', value: m.revenue_today.toFixed(2), suffix: '$' },
    ];
  });

  protected readonly completionRate = computed(() => {
    const m = this.metrics();
    if (!m) return 0;
    const totalTracked = m.pending_orders + m.completed_orders;
    if (totalTracked <= 0) return 0;
    return Math.round((m.completed_orders / totalTracked) * 100);
  });

  protected readonly avgOrderValue = computed(() => {
    const m = this.metrics();
    if (!m || m.orders_today <= 0) return 0;
    return Number((m.revenue_today / m.orders_today).toFixed(2));
  });

  protected readonly outOfStockCount = computed(() => {
    const m = this.metrics();
    if (!m) return 0;
    return m.low_stock_products.filter((item) => item.status === 'out_of_stock').length;
  });

  protected readonly lowStockOnlyCount = computed(() => {
    const m = this.metrics();
    if (!m) return 0;
    return m.low_stock_products.filter((item) => item.status === 'low_stock').length;
  });

  protected readonly roleHeadline = computed(() => {
    if (this.isManager()) {
      return 'You are viewing overall operations across inventory and order flow.';
    }

    return 'You are viewing your sales pipeline and fulfillment performance.';
  });

  protected readonly insights = computed(() => {
    const m = this.metrics();
    if (!m) return [];

    const items = [
      {
        title: 'Order Completion Rate',
        value: `${this.completionRate()}%`,
        helper: 'Completed vs pending order balance',
        tone: this.completionRate() >= 70 ? 'good' : this.completionRate() >= 40 ? 'warn' : 'risk',
      },
      {
        title: 'Average Order Value',
        value: `$${this.avgOrderValue().toFixed(2)}`,
        helper: 'Revenue per order today',
        tone: 'neutral',
      },
      {
        title: 'Out of Stock Alerts',
        value: `${this.outOfStockCount()}`,
        helper: 'Products that require immediate restock',
        tone: this.outOfStockCount() > 0 ? 'risk' : 'good',
      },
      {
        title: 'Low Stock Watchlist',
        value: `${this.lowStockOnlyCount()}`,
        helper: 'Products below threshold but still available',
        tone: this.lowStockOnlyCount() > 0 ? 'warn' : 'good',
      },
    ];

    return this.isManager() ? items : items.slice(0, 3);
  });

  protected readonly actionItems = computed(() => {
    if (this.isManager()) {
      return [
        'Prioritize out-of-stock items for immediate restock.',
        'Review pending orders older than today for bottlenecks.',
        'Track completion rate trend to improve fulfillment speed.',
      ];
    }

    return [
      'Clear your pending orders queue to improve completion rate.',
      'Focus on high-value orders to improve average order value.',
      'Avoid selling low-stock products until restock is confirmed.',
    ];
  });

  protected readonly attentionItems = computed(() => {
    const m = this.metrics();
    if (!m) return [];
    return m.low_stock_products.map((p) => ({
      item: p.name,
      note:
        p.current_stock <= 0
          ? 'Stock depleted'
          : `${p.current_stock} left (below threshold of ${p.min_stock_threshold})`,
      priority: p.status === 'out_of_stock' ? 'high' : 'medium',
    }));
  });

  ngOnInit(): void {
    this.ordersService.getDashboard().subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.loading.set(false);
        setTimeout(() => this.tryInitializeChart(), 50);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.tryInitializeChart(), 50);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private tryInitializeChart(): void {
    if (!this.chartElement?.nativeElement || !this.metrics()) {
      return;
    }

    this.initializeChart();
  }

  private initializeChart(): void {
    if (!this.chartElement?.nativeElement) {
      return;
    }

    const metrics = this.metrics();
    if (!metrics) {
      return;
    }

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartElement.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: ['Orders Today', 'Pending', 'Completed', 'Low Stock'],
        datasets: [
          {
            label: 'Operations Snapshot',
            data: [
              metrics.orders_today,
              metrics.pending_orders,
              metrics.completed_orders,
              metrics.low_stock_count,
            ],
            backgroundColor: [
              'rgba(54, 162, 235, 0.7)', // Total - Blue
              'rgba(255, 159, 64, 0.7)', // Pending - Orange
              'rgba(75, 192, 75, 0.7)', // Completed - Green
              'rgba(255, 99, 132, 0.7)', // Low Stock - Red
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(75, 192, 75, 1)',
              'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
          title: {
            display: true,
            text: 'Order and Inventory Health',
            font: { size: 14, weight: 'bold' },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }
}
