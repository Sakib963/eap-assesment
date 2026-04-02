import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
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
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

@Component({
  selector: 'app-restock-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputNumberModule,
    NzModalModule,
    NzTagModule,
    NzDrawerModule,
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

  protected readonly restockModalOpen = signal(false);
  protected readonly rulesDrawerOpen = signal(false);
  protected readonly restockingItem = signal<RestockQueueItem | null>(null);
  protected readonly restockQuantity = signal<number>(1);
  protected readonly submittingRestock = signal(false);

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
      { key: 'product_name', label: 'Product', width: '24%' },
      { key: 'current_stock', label: 'Current Stock', width: '12%' },
      { key: 'min_stock_threshold', label: 'Threshold', width: '12%' },
      { key: 'quantity_needed', label: 'Needed', width: '12%' },
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
        label: 'Restock',
        icon: 'plus-circle',
        type: 'primary',
        onClick: (item) => this.openRestockModal(item),
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

  protected openRestockModal(item: RestockQueueItem): void {
    this.restockingItem.set(item);
    this.restockQuantity.set(Math.max(1, item.quantity_needed));
    this.restockModalOpen.set(true);
  }

  protected closeRestockModal(): void {
    this.restockModalOpen.set(false);
    this.restockingItem.set(null);
    this.restockQuantity.set(1);
  }

  protected openRulesDrawer(): void {
    this.rulesDrawerOpen.set(true);
  }

  protected closeRulesDrawer(): void {
    this.rulesDrawerOpen.set(false);
  }

  protected confirmRestock(): void {
    const item = this.restockingItem();
    const qty = this.restockQuantity();
    if (!item || qty < 1) return;

    this.submittingRestock.set(true);
    this.ordersService
      .restockProduct(item.id, { quantity_added: qty })
      .pipe(finalize(() => this.submittingRestock.set(false)))
      .subscribe({
        next: () => {
          this.message.success(`Added ${qty} units to "${item.product_name}".`);
          this.closeRestockModal();
          this.loadQueue();
        },
        error: (error: Error) => {
          this.message.error(error.message || 'Failed to restock product');
        },
      });
  }

  protected onRestockQuantityChange(value: number | null): void {
    this.restockQuantity.set(Math.max(1, value ?? 1));
  }
}
