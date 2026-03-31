import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import type {
  Category,
  CreateProductPayload,
  PaginatedResponse,
  Product,
  ProductStatus,
} from '../../core/models/catalog.model';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzPaginationModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzSwitchModule,
    NzTableModule,
    NzTagModule,
  ],
  templateUrl: './products.page.html',
  styleUrl: './products.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly catalogService = inject(CatalogService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly totalProducts = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loadingProducts = signal(false);
  protected readonly loadingCategories = signal(false);
  protected readonly productModalVisible = signal(false);
  protected readonly editingProductId = signal<string | null>(null);
  protected readonly errorText = signal('');
  protected readonly filterStatusOptions: ProductStatus[] = ['active', 'out_of_stock', 'inactive'];

  protected readonly isEditingProduct = computed(() => Boolean(this.editingProductId()));

  protected readonly filterForm = this.formBuilder.group({
    search: [''],
    categoryId: [''],
    status: ['' as ProductStatus | ''],
  });

  protected readonly productForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category_id: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    current_stock: [0, [Validators.required, Validators.min(0)]],
    min_stock_threshold: [0, [Validators.required, Validators.min(0)]],
    is_active: [true],
  });

  constructor() {
    this.loadCategories();
    this.loadProducts();
  }

  protected loadProducts(): void {
    this.loadingProducts.set(true);
    this.errorText.set('');

    const filters = this.filterForm.getRawValue();

    this.catalogService
      .listProducts({
        page: this.page(),
        pageSize: this.pageSize(),
        search: filters.search ?? undefined,
        categoryId: filters.categoryId || undefined,
        status: (filters.status || undefined) as ProductStatus | undefined,
      })
      .pipe(finalize(() => this.loadingProducts.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<Product>) => {
          this.products.set(response.items);
          this.totalProducts.set(response.total);
        },
        error: (error: Error) => {
          this.errorText.set(error.message || 'Failed to load products');
        },
      });
  }

  protected loadCategories(): void {
    this.loadingCategories.set(true);

    this.catalogService
      .listCategories({ page: 1, pageSize: 100 })
      .pipe(finalize(() => this.loadingCategories.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<Category>) => this.categories.set(response.items),
        error: (error: Error) => {
          this.errorText.set(error.message || 'Failed to load categories');
        },
      });
  }

  protected onApplyFilters(): void {
    this.page.set(1);
    this.loadProducts();
  }

  protected onResetFilters(): void {
    this.filterForm.reset({ search: '', categoryId: '', status: '' });
    this.page.set(1);
    this.loadProducts();
  }

  protected onPageChange(nextPage: number): void {
    this.page.set(nextPage);
    this.loadProducts();
  }

  protected openCreateProductModal(): void {
    this.editingProductId.set(null);
    this.productForm.reset({
      name: '',
      category_id: '',
      description: '',
      price: 0,
      current_stock: 0,
      min_stock_threshold: 0,
      is_active: true,
    });
    this.productModalVisible.set(true);
  }

  protected openEditProductModal(product: Product): void {
    this.editingProductId.set(product.id);
    this.productForm.setValue({
      name: product.name,
      category_id: product.category_id,
      description: product.description ?? '',
      price: product.price,
      current_stock: product.current_stock,
      min_stock_threshold: product.min_stock_threshold,
      is_active: product.is_active,
    });
    this.productModalVisible.set(true);
  }

  protected submitProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const raw = this.productForm.getRawValue();
    const payload: CreateProductPayload = {
      name: raw.name ?? '',
      category_id: raw.category_id ?? '',
      description: raw.description?.trim() ? raw.description : null,
      price: Number(raw.price ?? 0),
      current_stock: Number(raw.current_stock ?? 0),
      min_stock_threshold: Number(raw.min_stock_threshold ?? 0),
      is_active: Boolean(raw.is_active),
    };
    const request$ = this.editingProductId()
      ? this.catalogService.updateProduct(this.editingProductId() as string, payload)
      : this.catalogService.createProduct(payload);

    request$.subscribe({
      next: () => {
        this.productModalVisible.set(false);
        this.loadProducts();
      },
      error: (error: Error) => {
        this.errorText.set(error.message || 'Failed to save product');
      },
    });
  }

  protected deleteProduct(productId: string): void {
    this.catalogService.deleteProduct(productId).subscribe({
      next: () => this.loadProducts(),
      error: (error: Error) => {
        this.errorText.set(error.message || 'Failed to delete product');
      },
    });
  }

  protected statusLabel(status: ProductStatus): string {
    if (status === 'out_of_stock') {
      return 'Out of Stock';
    }
    if (status === 'inactive') {
      return 'Inactive';
    }
    return 'Active';
  }

  protected statusColor(status: ProductStatus): string {
    if (status === 'out_of_stock') {
      return 'red';
    }
    if (status === 'inactive') {
      return 'default';
    }
    return 'green';
  }
}
