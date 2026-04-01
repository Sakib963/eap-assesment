import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import type { PaginatedResponse } from '../../core/models/catalog.model';
import type { RestockPriority, RestockQueueItem, RestockStatus } from '../../core/models/orders.model';
import { OrdersService } from '../../core/services/orders.service';
import {
  SharedDataListComponent,
  SharedListConfig,
} from '../../shared/components/data-list/data-list.component';
import {
  SharedFilterField,
  SharedFilterPanelComponent,
} from '../../shared/components/filter-panel/filter-panel.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-restock-page',
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
  templateUrl: './restock.page.html',
  styleUrl: './restock.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestockPage {
  private readonly ordersService = inject(OrdersService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  protected readonly queue = signal<RestockQueueItem[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);

  protected readonly filterForm = this.formBuilder.group({
    status: ['' as RestockStatus | ''],
    priority: ['' as RestockPriority | ''],
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
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      placeholder: 'All priorities',
      allowClear: true,
      defaultValue: '',
      options: [
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
    },
  ];

  protected readonly restockListConfig: SharedListConfig<RestockQueueItem> = {
    title: 'Restock Queue',
    defaultView: 'table',
    serialColumnWidth: '8%',
    actionsColumnWidth: '16%',
    cardGridClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    emptyText: 'No restock items found.',
    columns: [
      {
        key: 'product_name',
        label: 'Product',
        width: '24%',
      },
      {
        key: 'current_stock',
        label: 'Current Stock',
        width: '12%',
      },
      {
        key: 'min_stock_threshold',
        label: 'Threshold',
        width: '12%',
      },
      {
        key: 'quantity_needed',
        label: 'Needed',
        width: '12%',
      },
      {
        key: 'priority',
        label: 'Priority',
        width: '12%',
        type: 'tag',
        formatter: (item) => item.priority.toUpperCase(),
        tagColor: (item) => {
          if (item.priority === 'high') return 'red';
          if (item.priority === 'medium') return 'orange';
          return 'blue';
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: '12%',
        type: 'tag',
        formatter: (item) => (item.status === 'pending' ? 'Pending' : 'Completed'),
        tagColor: (item) => (item.status === 'pending' ? 'gold' : 'green'),
      },
    ],
    actions: [
      {
        label: 'Complete',
        icon: 'check-circle',
        type: 'default',
        visible: (item) => item.status === 'pending',
        onClick: (item) => this.completeRestock(item.id),
      },
    ],
  };

  constructor() {
    this.loadQueue();
  }

  protected loadQueue(): void {
    this.loading.set(true);

    const { status, priority } = this.filterForm.getRawValue();

    this.ordersService
      .listRestockQueue({
        page: this.page(),
        pageSize: this.pageSize(),
        status: (status || undefined) as RestockStatus | undefined,
        priority: (priority || undefined) as RestockPriority | undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<RestockQueueItem>) => {
          this.queue.set(response.items);
          this.totalItems.set(response.total);
        },
        error: (error: Error) => {
          this.message.error(error.message || 'Failed to load restock queue');
        },
      });
  }

  protected onFiltersChange(): void {
    this.page.set(1);
    this.loadQueue();
  }

  protected onPageChange(nextPage: number): void {
    this.page.set(nextPage);
    this.loadQueue();
  }

  protected completeRestock(id: string): void {
    this.ordersService.markRestockCompleted(id).subscribe({
      next: () => {
        this.message.success('Restock queue item marked as completed.');
        this.loadQueue();
      },
      error: (error: Error) => {
        this.message.error(error.message || 'Failed to update restock status');
      },
    });
  }
}
