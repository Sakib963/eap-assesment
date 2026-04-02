import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTagModule } from 'ng-zorro-antd/tag';
import type { Order, OrderStatus } from '../../../core/models/orders.model';
import { OrdersService } from '../../../core/services/orders.service';

const ORDER_LIFECYCLE: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

@Component({
  selector: 'app-orders-view-page',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzCardModule, NzIconModule, NzStepsModule, NzTagModule],
  templateUrl: './orders-view.page.html',
  styleUrl: './orders-view.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersViewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly message = inject(NzMessageService);

  protected readonly loading = signal(false);
  protected readonly updating = signal(false);
  protected readonly order = signal<Order | null>(null);
  protected readonly lifecycleSteps = ORDER_LIFECYCLE;

  /** 0-based index for nz-steps [nzCurrent]. */
  protected readonly stepsCurrentIndex = computed(() => {
    const status = this.order()?.status;
    if (!status || status === 'cancelled') return 0;
    return Math.max(0, ORDER_LIFECYCLE.indexOf(status));
  });

  /**
   * When the order is delivered (final state) pass 'finish' so the last
   * step renders with a check rather than the "in-progress" ring.
   */
  protected readonly stepsStatus = computed((): 'process' | 'finish' => {
    return this.order()?.status === 'delivered' ? 'finish' : 'process';
  });

  protected readonly nextLifecycleStatus = computed<OrderStatus | null>(() => {
    const status = this.order()?.status;
    if (!status || status === 'cancelled') return null;
    const idx = ORDER_LIFECYCLE.indexOf(status);
    if (idx < 0 || idx >= ORDER_LIFECYCLE.length - 1) return null;
    return ORDER_LIFECYCLE[idx + 1] ?? null;
  });

  protected readonly canAdvanceLifecycle = computed(() => this.nextLifecycleStatus() !== null);

  protected readonly canCancelOrder = computed(() => {
    const s = this.order()?.status;
    return !!s && s !== 'cancelled' && s !== 'delivered';
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/orders']);
      return;
    }
    this.loadOrder(id);
  }

  protected goBack(): void {
    void this.router.navigate(['/orders']);
  }

  protected advanceLifecycle(): void {
    const next = this.nextLifecycleStatus();
    if (next) this.updateStatus(next);
  }

  protected cancelOrder(): void {
    this.updateStatus('cancelled');
  }

  protected nextActionLabel(): string {
    const next = this.nextLifecycleStatus();
    return next ? `Mark as ${this.formatStatus(next)}` : '';
  }

  protected formatStatus(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return map[status] ?? status;
  }

  protected statusColor(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      delivered: 'green',
      shipped: 'processing',
      confirmed: 'blue',
      cancelled: 'default',
      pending: 'gold',
    };
    return map[status] ?? 'default';
  }

  protected shortId(id: string): string {
    return id.slice(-8).toUpperCase();
  }

  private updateStatus(status: OrderStatus): void {
    const current = this.order();
    if (!current || this.updating() || current.status === status) return;

    this.updating.set(true);
    this.ordersService
      .updateOrderStatus(current.id, { status })
      .pipe(finalize(() => this.updating.set(false)))
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.message.success(`Order status updated to ${this.formatStatus(status)}.`);
        },
        error: (err: Error) => {
          this.message.error(err.message || 'Failed to update status');
        },
      });
  }

  private loadOrder(id: string): void {
    this.loading.set(true);
    this.ordersService
      .getOrder(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (order) => this.order.set(order),
        error: (err: Error) => {
          this.message.error(err.message || 'Failed to load order details');
          void this.router.navigate(['/orders']);
        },
      });
  }
}
