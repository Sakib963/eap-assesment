import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import type {
  Category,
  CreateProductPayload,
  PaginatedResponse,
  Product,
  ProductStatus,
  UpdateProductPayload,
} from '../../core/models/catalog.model';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/services/auth.service';
import {
  SharedDataListComponent,
  SharedListConfig,
} from '../../shared/components/data-list/data-list.component';
import {
  SharedFilterField,
  SharedFilterPanelComponent,
} from '../../shared/components/filter-panel/filter-panel.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzDrawerModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzIconModule,
    NzSelectModule,
    SharedDataListComponent,
    SharedFilterPanelComponent,
  ],
  templateUrl: './products.page.html',
  styleUrl: './products.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly catalogService = inject(CatalogService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly totalProducts = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);
  protected readonly loadingCategories = signal(false);
  protected readonly drawerVisible = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingProductId = signal<string | null>(null);
  protected readonly errorText = signal('');
  protected readonly isMobileViewport = signal(this.detectMobileViewport());

  protected readonly isEditing = computed(() => Boolean(this.editingProductId()));
  protected readonly canManageProducts = computed(() => this.authService.user()?.role === 'manager');
  protected readonly drawerWidth = computed(() => (this.isMobileViewport() ? '100vw' : 560));

  protected readonly filterForm = this.formBuilder.group({
    search: [''],
    categoryId: [''],
    status: ['' as ProductStatus | ''],
  });

  protected readonly productForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/.*\S.*/)]],
    category_id: ['', Validators.required],
    description: ['', [Validators.maxLength(500)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    current_stock: [0, [Validators.required, Validators.min(0)]],
    min_stock_threshold: [0, [Validators.required, Validators.min(0)]],
    status: ['active' as ProductStatus, Validators.required],
  });

  protected readonly filterFields: SharedFilterField[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Product name',
      defaultValue: '',
    },
    {
      key: 'categoryId',
      label: 'Category',
      type: 'select',
      placeholder: 'All categories',
      allowClear: true,
      defaultValue: '',
      options: [] as { label: string; value: string }[],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'All statuses',
      allowClear: true,
      defaultValue: '',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Out of Stock', value: 'out_of_stock' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  protected readonly productListConfig: SharedListConfig<Product> = {
    title: 'Product List',
    defaultView: 'table',
    serialColumnWidth: '6%',
    serialHint: {
      icon: 'warning',
      visible: (item) => item.status !== 'inactive' && item.current_stock <= item.min_stock_threshold,
      tooltip: (item) => {
        if (item.current_stock <= 0) {
          return 'Out of stock';
        }

        return `Low stock: ${item.current_stock} left (threshold ${item.min_stock_threshold})`;
      },
      color: (item) => (item.current_stock <= 0 ? '#dc2626' : '#d97706'),
    },
    actionsColumnWidth: '12%',
    cardGridClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
    emptyText: 'No products match your filters.',
    showEmptyState: false,
    columns: [
      {
        key: 'name',
        label: 'Name',
        width: '20%',
      },
      {
        key: 'category_name',
        label: 'Category',
        width: '14%',
      },
      {
        key: 'price',
        label: 'Price',
        width: '10%',
        formatter: (item) => `$${item.price.toFixed(2)}`,
      },
      {
        key: 'current_stock',
        label: 'Stock',
        width: '8%',
      },
      {
        key: 'min_stock_threshold',
        label: 'Min. Threshold',
        width: '8%',
      },
      {
        key: 'status',
        label: 'Status',
        width: '10%',
        type: 'tag',
        formatter: (item) => {
          if (item.status === 'inactive') return 'Inactive';
          if (item.status === 'out_of_stock') return 'Out of Stock';
          return 'Active';
        },
        tagColor: (item) => {
          if (item.status === 'inactive') return 'default';
          if (item.status === 'out_of_stock') return 'red';
          return 'green';
        },
      },
    ],
    actions: [
      {
        label: 'Edit',
        icon: 'edit',
        type: 'default',
        visible: () => this.canManageProducts(),
        onClick: (product) => this.openEditDrawer(product),
      },
    ],
  };

  constructor() {
    this.loadCategories();
    this.loadProducts();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.isMobileViewport.set(this.detectMobileViewport());
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.errorText.set('');

    const { search, categoryId, status } = this.filterForm.getRawValue();

    this.catalogService
      .listProducts({
        page: this.page(),
        pageSize: this.pageSize(),
        search: search ?? undefined,
        categoryId: categoryId || undefined,
        status: (status || undefined) as ProductStatus | undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<Product>) => {
          this.products.set(response.items);
          this.totalProducts.set(response.total);
        },
        error: (error: Error) => {
          this.errorText.set(error.message || 'Failed to load products');
          this.message.error(error.message || 'Failed to load products');
        },
      });
  }

  protected loadCategories(): void {
    this.loadingCategories.set(true);

    this.catalogService
      .listCategories({ page: 1, pageSize: 100 })
      .pipe(finalize(() => this.loadingCategories.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<Category>) => {
          this.categories.set(response.items);
          const categoryOptions = response.items.map((cat) => ({
            label: cat.name,
            value: cat.id,
          }));
          const filterFields = this.filterFields.map((field) =>
            field.key === 'categoryId' ? { ...field, options: categoryOptions } : field
          );
          this.filterFields.length = 0;
          this.filterFields.push(...filterFields);
        },
        error: (error: Error) => {
          this.errorText.set(error.message || 'Failed to load categories');
          this.message.error(error.message || 'Failed to load categories');
        },
      });
  }

  protected onFiltersChange(): void {
    this.page.set(1);
    this.loadProducts();
  }

  protected onPageChange(nextPage: number): void {
    this.page.set(nextPage);
    this.loadProducts();
  }

  protected openCreateDrawer(): void {
    if (!this.canManageProducts()) return;

    this.editingProductId.set(null);
    this.productForm.reset({
      name: '',
      category_id: '',
      description: '',
      price: 0,
      current_stock: 0,
      min_stock_threshold: 0,
      status: 'active',
    });
    this.drawerVisible.set(true);
  }

  protected openEditDrawer(product: Product): void {
    if (!this.canManageProducts()) return;

    this.editingProductId.set(product.id);
    this.productForm.setValue({
      name: product.name,
      category_id: product.category_id,
      description: product.description ?? '',
      price: product.price,
      current_stock: product.current_stock,
      min_stock_threshold: product.min_stock_threshold,
      status: product.status,
    });
    this.drawerVisible.set(true);
  }

  protected closeDrawer(): void {
    if (this.saving()) {
      return;
    }

    this.drawerVisible.set(false);
  }

  protected submitProduct(): void {
    if (this.saving()) {
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.message.warning('Please fill all required fields correctly.');
      return;
    }

    const raw = this.productForm.getRawValue();
    const payload: CreateProductPayload = {
      name: (raw.name ?? '').trim(),
      category_id: raw.category_id ?? '',
      description: raw.description?.trim() ? raw.description : null,
      price: Number(raw.price ?? 0),
      current_stock: Number(raw.current_stock ?? 0),
      min_stock_threshold: Number(raw.min_stock_threshold ?? 0),
      status: (raw.status ?? 'active') as ProductStatus,
    };

    const request$ = this.editingProductId()
      ? this.catalogService.updateProduct(
          this.editingProductId() as string,
          payload as UpdateProductPayload
        )
      : this.catalogService.createProduct(payload);

    this.saving.set(true);
    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.drawerVisible.set(false);
          this.message.success(
            this.isEditing() ? 'Product updated successfully.' : 'Product created successfully.'
          );
          this.loadProducts();
        },
        error: (error: Error) => {
          this.errorText.set(error.message || 'Failed to save product');
          this.message.error(error.message || 'Failed to save product');
        },
      });
  }

  private detectMobileViewport(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth < 992 : false;
  }
}
