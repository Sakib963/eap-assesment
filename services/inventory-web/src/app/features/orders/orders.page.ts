import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import type { PaginatedResponse, Product } from '../../core/models/catalog.model';
import type {
  CreateOrderPayload,
  Order,
  OrderStatus,
} from '../../core/models/orders.model';
import { CatalogService } from '../../core/services/catalog.service';
import { OrdersService } from '../../core/services/orders.service';
import {
  SharedDataListComponent,
  SharedListConfig,
} from '../../shared/components/data-list/data-list.component';
import {
  SharedFilterField,
  SharedFilterPanelComponent,
} from '../../shared/components/filter-panel/filter-panel.component';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzDrawerModule,
    NzFormModule,
    NzIconModule,
    NzInputNumberModule,
    NzSelectModule,
    SharedDataListComponent,
    SharedFilterPanelComponent,
  ],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  private readonly ordersService = inject(OrdersService);
  private readonly catalogService = inject(CatalogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly totalOrders = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);
  protected readonly loadingProducts = signal(false);
  protected readonly drawerVisible = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorText = signal('');
  protected readonly isMobileViewport = signal(this.detectMobileViewport());

  protected readonly drawerWidth = computed(() => (this.isMobileViewport() ? '100vw' : 620));

  protected readonly filterForm = this.formBuilder.group({
    status: ['' as OrderStatus | ''],
    fromDate: [''],
    toDate: [''],
  });

  protected readonly orderForm = this.formBuilder.group({
    items: this.formBuilder.array([this.createOrderItemGroup()]),
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
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      key: 'fromDate',
      label: 'From Date',
      type: 'date',
      placeholder: 'YYYY-MM-DD',
      defaultValue: '',
    },
    {
      key: 'toDate',
      label: 'To Date',
      type: 'date',
      placeholder: 'YYYY-MM-DD',
      defaultValue: '',
    },
  ];

  protected readonly orderListConfig: SharedListConfig<Order> = {
    title: 'Order List',
    defaultView: 'table',
    serialColumnWidth: '8%',
    actionsColumnWidth: '24%',
    cardGridClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    emptyText: 'No orders match your filters.',
    columns: [
      {
        key: 'id',
        label: 'Order ID',
        width: '24%',
        formatter: (item) => item.id.slice(0, 8).toUpperCase(),
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
        width: '12%',
        type: 'tag',
        formatter: (item) => this.formatStatus(item.status),
        tagColor: (item) => {
          if (item.status === 'completed') return 'green';
          if (item.status === 'cancelled') return 'default';
          return 'blue';
        },
      },
    ],
    actions: [
      {
        label: 'Complete',
        icon: 'check-circle',
        type: 'default',
        visible: (item) => item.status === 'pending',
        onClick: (item) => this.changeOrderStatus(item.id, 'completed'),
      },
      {
        label: 'Cancel',
        icon: 'close-circle',
        type: 'default',
        danger: true,
        confirmTitle: 'Cancel this order and restore stock?',
        visible: (item) => item.status !== 'cancelled',
        onClick: (item) => this.changeOrderStatus(item.id, 'cancelled'),
      },
    ],
  };

  constructor() {
    this.loadOrders();
    this.loadActiveProducts();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.isMobileViewport.set(this.detectMobileViewport());
  }

  protected get orderItems(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }

  protected get productOptions(): Array<{ label: string; value: string }> {
    return this.products().map((product) => ({
      label: `${product.name} (Stock: ${product.current_stock})`,
      value: product.id,
    }));
  }

  protected loadOrders(): void {
    this.loading.set(true);
    this.errorText.set('');

    const { status, fromDate, toDate } = this.filterForm.getRawValue();

    this.ordersService
      .listOrders({
        page: this.page(),
        pageSize: this.pageSize(),
        status: (status || undefined) as OrderStatus | undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<Order>) => {
          this.orders.set(response.items);
          this.totalOrders.set(response.total);
        },
        error: (error: Error) => {
          this.errorText.set(error.message || 'Failed to load orders');
          this.message.error(error.message || 'Failed to load orders');
        },
      });
  }

  protected loadActiveProducts(): void {
    this.loadingProducts.set(true);

    this.catalogService
      .listProducts({ page: 1, pageSize: 100, status: 'active' })
      .pipe(finalize(() => this.loadingProducts.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<Product>) => {
          this.products.set(response.items);
        },
        error: (error: Error) => {
          this.message.error(error.message || 'Failed to load product catalog');
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

  protected openCreateDrawer(): void {
    this.resetOrderForm();
    this.drawerVisible.set(true);
  }

  protected closeDrawer(): void {
    if (this.saving()) {
      return;
    }

    this.drawerVisible.set(false);
  }

  protected addOrderItem(): void {
    this.orderItems.push(this.createOrderItemGroup());
  }

  protected removeOrderItem(index: number): void {
    if (this.orderItems.length <= 1) {
      this.message.warning('At least one item is required in an order.');
      return;
    }

    this.orderItems.removeAt(index);
  }

  protected submitOrder(): void {
    if (this.saving()) {
      return;
    }

    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.message.warning('Please fill all required order fields correctly.');
      return;
    }

    const payload: CreateOrderPayload = {
      items: this.orderItems.controls.map((control) => ({
        product_id: String(control.get('product_id')?.value ?? ''),
        quantity: Number(control.get('quantity')?.value ?? 0),
      })),
    };

    this.saving.set(true);
    this.ordersService
      .createOrder(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.drawerVisible.set(false);
          this.message.success('Order created successfully.');
          this.loadOrders();
          this.loadActiveProducts();
        },
        error: (error: Error) => {
          this.errorText.set(error.message || 'Failed to create order');
          this.message.error(error.message || 'Failed to create order');
        },
      });
  }

  protected changeOrderStatus(orderId: string, status: OrderStatus): void {
    this.ordersService.updateOrderStatus(orderId, { status }).subscribe({
      next: () => {
        this.message.success('Order status updated successfully.');
        this.loadOrders();
        this.loadActiveProducts();
      },
      error: (error: Error) => {
        this.errorText.set(error.message || 'Failed to update order status');
        this.message.error(error.message || 'Failed to update order status');
      },
    });
  }

  protected productErrorTip(index: number): string {
    const control = this.orderItems.at(index)?.get('product_id');
    if (control?.hasError('required')) {
      return 'Please select a product';
    }
    return '';
  }

  protected quantityErrorTip(index: number): string {
    const control = this.orderItems.at(index)?.get('quantity');
    if (control?.hasError('required')) {
      return 'Quantity is required';
    }
    if (control?.hasError('min')) {
      return 'Quantity must be at least 1';
    }
    return '';
  }

  private createOrderItemGroup() {
    return this.formBuilder.group({
      product_id: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
    });
  }

  private resetOrderForm(): void {
    while (this.orderItems.length > 0) {
      this.orderItems.removeAt(0);
    }
    this.orderItems.push(this.createOrderItemGroup());
    this.orderForm.markAsPristine();
    this.orderForm.markAsUntouched();
  }

  private formatDate(value: string): string {
    return new Date(value).toLocaleDateString();
  }

  private formatStatus(status: OrderStatus): string {
    if (status === 'completed') return 'Completed';
    if (status === 'cancelled') return 'Cancelled';
    return 'Pending';
  }

  private detectMobileViewport(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth < 992 : false;
  }
}
