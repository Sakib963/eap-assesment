import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import type { Product } from '../../../core/models/catalog.model';
import type { CreateOrderPayload } from '../../../core/models/orders.model';
import { CatalogService } from '../../../core/services/catalog.service';
import { OrdersService } from '../../../core/services/orders.service';

interface DraftOrderItem {
  product_id: string;
  product_name: string;
  category_name: string;
  unit_price: number;
  available_stock: number;
  quantity: number;
  line_total: number;
}

@Component({
  selector: 'app-orders-create-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzSelectModule,
    NzTableModule,
  ],
  templateUrl: './orders-create.page.html',
  styleUrl: './orders-create.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersCreatePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly ordersService = inject(OrdersService);

  protected readonly products = signal<Product[]>([]);
  protected readonly orderItems = signal<DraftOrderItem[]>([]);
  protected readonly loadingProducts = signal(false);
  protected readonly itemModalVisible = signal(false);
  protected readonly saving = signal(false);
  protected readonly formSubmitAttempted = signal(false);
  protected readonly itemValidationMessage = signal('');
  protected readonly isMobileViewport = signal(this.detectMobileViewport());

  protected readonly orderForm = this.formBuilder.group({
    customer_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    customer_phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(30)]],
    customer_address: ['', [Validators.maxLength(255)]],
    delivery_instruction: ['', [Validators.maxLength(500)]],
    discount_amount: [0, [Validators.min(0)]],
  });

  protected readonly itemForm = this.formBuilder.group({
    product_id: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  protected readonly subtotalAmount = computed(() =>
    this.orderItems().reduce((sum, item) => sum + item.line_total, 0)
  );

  protected readonly discountAmount = computed(() => {
    const value = Number(this.orderForm.get('discount_amount')?.value ?? 0);
    if (Number.isNaN(value) || value < 0) {
      return 0;
    }
    return value;
  });

  protected readonly grandTotal = computed(() => Math.max(0, this.subtotalAmount() - this.discountAmount()));

  protected readonly groupedProductOptions = computed(() => {
    const selectedIds = new Set(this.orderItems().map((item) => item.product_id));
    const bucket = new Map<string, Array<{ label: string; value: string; disabled: boolean }>>();

    for (const product of this.products()) {
      const categoryName = product.category_name || 'Uncategorized';
      const disabled =
        selectedIds.has(product.id) || product.status === 'inactive' || product.current_stock <= 0;
      const statusText = product.status === 'inactive'
        ? 'Inactive'
        : product.current_stock <= 0
          ? 'Out of Stock'
          : `Stock: ${product.current_stock}`;

      const option = {
        label: `${product.name} (${statusText})`,
        value: product.id,
        disabled,
      };

      const current = bucket.get(categoryName) ?? [];
      current.push(option);
      bucket.set(categoryName, current);
    }

    return Array.from(bucket.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, options]) => ({
        category,
        options: options.sort((a, b) => a.label.localeCompare(b.label)),
      }));
  });

  constructor() {
    this.loadProducts();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.isMobileViewport.set(this.detectMobileViewport());
  }

  protected get selectedProductFromModal(): Product | null {
    const productId = String(this.itemForm.get('product_id')?.value ?? '');
    return this.products().find((item) => item.id === productId) || null;
  }

  protected get modalRequestedQuantity(): number {
    return Number(this.itemForm.get('quantity')?.value ?? 0);
  }

  protected get modalLineTotal(): number {
    const product = this.selectedProductFromModal;
    if (!product) return 0;
    return Number(product.price) * this.modalRequestedQuantity;
  }

  protected get exceedsModalStock(): boolean {
    const product = this.selectedProductFromModal;
    if (!product) return false;
    return this.modalRequestedQuantity > product.current_stock;
  }

  protected openItemModal(): void {
    this.itemForm.reset({ product_id: '', quantity: 1 }, { emitEvent: false });
    this.itemModalVisible.set(true);
  }

  protected closeItemModal(): void {
    this.itemModalVisible.set(false);
  }

  protected addItemFromModal(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const productId = String(this.itemForm.get('product_id')?.value ?? '');
    const quantity = Number(this.itemForm.get('quantity')?.value ?? 0);
    const product = this.products().find((item) => item.id === productId);

    if (!product) {
      this.message.error('Selected product not found.');
      return;
    }

    if (!product.is_active || product.status === 'inactive') {
      this.message.warning('Inactive products cannot be added to orders.');
      return;
    }

    if (this.orderItems().some((item) => item.product_id === productId)) {
      this.message.warning('Duplicate product entries are not allowed in the same order.');
      return;
    }

    if (quantity > product.current_stock) {
      this.message.warning(`Only ${product.current_stock} items available in stock.`);
      return;
    }

    this.orderItems.update((items) => [
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        category_name: product.category_name || 'Uncategorized',
        unit_price: Number(product.price),
        available_stock: product.current_stock,
        quantity,
        line_total: Number(product.price) * quantity,
      },
    ]);

    this.itemValidationMessage.set('');
    this.itemModalVisible.set(false);
  }

  protected removeItem(productId: string): void {
    this.orderItems.update((items) => items.filter((item) => item.product_id !== productId));
    if (this.orderItems().length > 0) {
      this.itemValidationMessage.set('');
    }
  }

  protected submitOrder(): void {
    if (this.saving()) return;

    this.formSubmitAttempted.set(true);

    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.message.warning('Please fill all required fields correctly.');
      return;
    }

    if (!this.orderItems().length) {
      this.itemValidationMessage.set('Add at least one product to create an order.');
      this.message.warning('Add at least one product to create an order.');
      return;
    }

    if (this.orderItems().some((item) => item.quantity > item.available_stock)) {
      const invalidItem = this.orderItems().find((item) => item.quantity > item.available_stock);
      this.itemValidationMessage.set(
        `Only ${invalidItem?.available_stock ?? 0} items available in stock for ${invalidItem?.product_name ?? 'selected product'}.`
      );
      this.message.warning(`Only ${invalidItem?.available_stock ?? 0} items available in stock.`);
      return;
    }

    if (this.discountAmount() > this.subtotalAmount()) {
      this.message.warning('Discount amount cannot exceed order subtotal.');
      return;
    }

    const payload: CreateOrderPayload = {
      customer_name: String(this.orderForm.get('customer_name')?.value ?? '').trim(),
      customer_phone: String(this.orderForm.get('customer_phone')?.value ?? '').trim(),
      customer_address: String(this.orderForm.get('customer_address')?.value ?? '').trim() || null,
      delivery_instruction:
        String(this.orderForm.get('delivery_instruction')?.value ?? '').trim() || null,
      discount_amount: this.discountAmount(),
      items: this.orderItems().map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    this.saving.set(true);
    this.ordersService
      .createOrder(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.itemValidationMessage.set('');
          this.message.success('Order created successfully.');
          void this.router.navigate(['/orders']);
        },
        error: (error: Error) => {
          this.message.error(error.message || 'Failed to create order');
        },
      });
  }

  protected goBackToOrders(): void {
    void this.router.navigate(['/orders']);
  }

  protected customerNameErrorTip(): string {
    const control = this.orderForm.get('customer_name');
    if (!this.shouldShowControlError('customer_name')) return '';
    if (control?.hasError('required')) return 'Customer name is required';
    if (control?.hasError('minlength')) return 'Customer name must be at least 2 characters';
    if (control?.hasError('maxlength')) return 'Customer name must not exceed 120 characters';
    return '';
  }

  protected customerPhoneErrorTip(): string {
    const control = this.orderForm.get('customer_phone');
    if (!this.shouldShowControlError('customer_phone')) return '';
    if (control?.hasError('required')) return 'Phone number is required';
    if (control?.hasError('minlength')) return 'Phone number is too short';
    if (control?.hasError('maxlength')) return 'Phone number is too long';
    return '';
  }

  protected discountErrorTip(): string {
    const control = this.orderForm.get('discount_amount');
    if (!this.shouldShowControlError('discount_amount')) return '';
    if (control?.hasError('min')) return 'Discount cannot be negative';
    return '';
  }

  protected customerNameValidateStatus(): 'error' | '' {
    return this.shouldShowControlError('customer_name') ? 'error' : '';
  }

  protected customerPhoneValidateStatus(): 'error' | '' {
    return this.shouldShowControlError('customer_phone') ? 'error' : '';
  }

  protected discountValidateStatus(): 'error' | '' {
    return this.shouldShowControlError('discount_amount') ? 'error' : '';
  }

  protected productErrorTip(): string {
    const control = this.itemForm.get('product_id');
    if (control?.hasError('required')) return 'Please select a product';
    return '';
  }

  protected quantityErrorTip(): string {
    const control = this.itemForm.get('quantity');
    if (control?.hasError('required')) return 'Quantity is required';
    if (control?.hasError('min')) return 'Quantity must be at least 1';
    return '';
  }

  private async loadProducts(): Promise<void> {
    this.loadingProducts.set(true);
    try {
      const pageSize = 100;
      let page = 1;
      let total = 0;
      const allProducts: Product[] = [];

      do {
        const response = await firstValueFrom(this.catalogService.listProducts({ page, pageSize }));
        allProducts.push(...response.items);
        total = response.total;
        page += 1;
      } while (allProducts.length < total);

      this.products.set(allProducts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load product catalog';
      this.message.error(message);
    } finally {
      this.loadingProducts.set(false);
    }
  }

  private detectMobileViewport(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth < 992 : false;
  }

  private shouldShowControlError(controlName: string): boolean {
    const control = this.orderForm.get(controlName);
    if (!control || !control.invalid) {
      return false;
    }

    return control.touched || control.dirty || this.formSubmitAttempted();
  }
}
