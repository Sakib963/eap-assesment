import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import type { PaginatedResponse } from '../../../core/models/catalog.model';
import type { Order, OrderStatus } from '../../../core/models/orders.model';
import { OrdersService } from '../../../core/services/orders.service';
import {
  SharedDataListComponent,
  SharedListConfig,
} from '../../../shared/components/data-list/data-list.component';
import {
  SharedFilterField,
  SharedFilterPanelComponent,
} from '../../../shared/components/filter-panel/filter-panel.component';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    SharedDataListComponent,
    SharedFilterPanelComponent,
  ],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  private readonly ordersService = inject(OrdersService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly orders = signal<Order[]>([]);
  protected readonly totalOrders = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);

  protected readonly filterForm = this.formBuilder.group({
    status: ['' as OrderStatus | ''],
    orderDateRange: [null as [Date, Date] | null],
  });

  protected readonly filterFields: SharedFilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'All statuses',
      allowClear: true,
      defaultValue: '',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      key: 'orderDateRange',
      label: 'Order Date Range',
      type: 'date-range',
      placeholder: 'Select date range',
      defaultValue: null,
    },
  ];

  protected readonly orderListConfig: SharedListConfig<Order> = {
    title: 'Order List',
    defaultView: 'table',
    serialColumnWidth: '8%',
    actionsColumnWidth: '12%',
    cardGridClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    emptyText: 'No orders match your filters.',
    columns: [
      {
        key: 'customer_name',
        label: 'Customer',
        width: '22%',
      },
      {
        key: 'customer_phone',
        label: 'Phone',
        width: '16%',
      },
      {
        key: 'items_count',
        label: 'Items',
        width: '10%',
      },
      {
        key: 'total_amount',
        label: 'Total',
        width: '16%',
        formatter: (item) => `$${item.total_amount.toFixed(2)}`,
      },
      {
        key: 'created_at',
        label: 'Created',
        width: '20%',
        formatter: (item) => this.formatDate(item.created_at),
      },
      {
        key: 'status',
        label: 'Status',
        width: '16%',
        type: 'tag',
        formatter: (item) => this.formatStatus(item.status),
        tagColor: (item) => {
          if (item.status === 'delivered') return 'green';
          if (item.status === 'shipped') return 'processing';
          if (item.status === 'confirmed') return 'blue';
          if (item.status === 'cancelled') return 'default';
          return 'gold';
        },
      },
    ],
    actions: [
      {
        label: 'View',
        icon: 'eye',
        type: 'default',
        onClick: (item) => this.goToOrderView(item.id),
      },
    ],
  };

  constructor() {
    this.loadOrders();
  }

  protected loadOrders(): void {
    this.loading.set(true);

    const { status, orderDateRange } = this.filterForm.getRawValue();
    const fromDate = orderDateRange?.[0] ? this.formatDateParam(orderDateRange[0]) : undefined;
    const toDate = orderDateRange?.[1] ? this.formatDateParam(orderDateRange[1]) : undefined;

    this.ordersService
      .listOrders({
        page: this.page(),
        pageSize: this.pageSize(),
        status: (status || undefined) as OrderStatus | undefined,
        fromDate,
        toDate,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<Order>) => {
          this.orders.set(response.items);
          this.totalOrders.set(response.total);
        },
      });
  }

  protected onFiltersChange(): void {
    this.page.set(1);
    this.loadOrders();
  }

  protected onPageChange(nextPage: number): void {
    this.page.set(nextPage);
    this.loadOrders();
  }

  protected goToCreatePage(): void {
    void this.router.navigate(['/orders/create']);
  }

  protected goToOrderView(orderId: string): void {
    void this.router.navigate(['/orders', orderId]);
  }

  protected formatStatus(status: OrderStatus): string {
    if (status === 'confirmed') return 'Confirmed';
    if (status === 'shipped') return 'Shipped';
    if (status === 'delivered') return 'Delivered';
    if (status === 'cancelled') return 'Cancelled';
    return 'Pending';
  }

  private formatDate(value: string): string {
    return new Date(value).toLocaleDateString();
  }

  private formatDateParam(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
