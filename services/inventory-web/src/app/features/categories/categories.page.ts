import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import type {
  Category,
  CategoryStatus,
  CreateCategoryPayload,
  PaginatedResponse,
  UpdateCategoryPayload,
} from '../../core/models/catalog.model';
import { CatalogService } from '../../core/services/catalog.service';
import {
  SharedDataListComponent,
  SharedListConfig,
} from '../../shared/components/data-list/data-list.component';
import {
  SharedFilterField,
  SharedFilterPanelComponent,
} from '../../shared/components/filter-panel/filter-panel.component';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzDrawerModule,
    NzFormModule,
    NzInputModule,
    NzIconModule,
    NzModalModule,
    NzSelectModule,
    SharedDataListComponent,
    SharedFilterPanelComponent,
  ],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage {
  private readonly catalogService = inject(CatalogService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly totalCategories = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);
  protected readonly drawerVisible = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingCategoryId = signal<string | null>(null);
  protected readonly errorText = signal('');
  protected readonly isMobileViewport = signal(this.detectMobileViewport());

  protected readonly isEditing = computed(() => Boolean(this.editingCategoryId()));
  protected readonly drawerWidth = computed(() => (this.isMobileViewport() ? '100vw' : 460));

  protected readonly filterForm = this.formBuilder.group({
    search: [''],
    status: ['' as CategoryStatus | ''],
  });

  protected readonly categoryForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/.*\S.*/)]],
    description: ['', [Validators.maxLength(500)]],
    status: ['active' as CategoryStatus, Validators.required],
  });

  protected readonly filterFields: SharedFilterField[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Category name',
      defaultValue: '',
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
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  protected readonly categoryListConfig: SharedListConfig<Category> = {
    title: 'Category List',
    defaultView: 'table',
    cardGridClass: 'grid-cols-1 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    emptyText: 'No categories match your filters.',
    showEmptyState: false,
    columns: [
      {
        key: 'name',
        label: 'Name',
      },
      {
        key: 'description',
        label: 'Description',
        formatter: (item) => item.description || 'No description',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'tag',
        formatter: (item) => (item.is_active ? 'Active' : 'Inactive'),
        tagColor: (item) => (item.is_active ? 'green' : 'default'),
      },
    ],
    actions: [
      {
        label: 'Edit',
        icon: 'edit',
        type: 'default',
        onClick: (category) => this.openEditDrawer(category),
      },
      {
        label: 'Delete',
        icon: 'delete',
        type: 'default',
        danger: true,
        onClick: (category) => this.confirmDeleteCategory(category),
      },
    ],
  };

  constructor() {
    this.loadCategories();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.isMobileViewport.set(this.detectMobileViewport());
  }

  protected loadCategories(): void {
    this.loading.set(true);
    this.errorText.set('');

    const { search, status } = this.filterForm.getRawValue();

    this.catalogService
      .listCategories({
        page: this.page(),
        pageSize: this.pageSize(),
        search: search ?? undefined,
        status: (status || undefined) as CategoryStatus | undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<Category>) => {
          this.categories.set(response.items);
          this.totalCategories.set(response.total);
        },
        error: (error: Error) => {
          this.errorText.set(error.message || 'Failed to load categories');
          this.message.error(error.message || 'Failed to load categories');
        },
      });
  }

  protected onFiltersChange(): void {
    this.page.set(1);
    this.loadCategories();
  }

  protected onPageChange(nextPage: number): void {
    this.page.set(nextPage);
    this.loadCategories();
  }

  protected openCreateDrawer(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ name: '', description: '', status: 'active' });
    this.drawerVisible.set(true);
  }

  protected openEditDrawer(category: Category): void {
    this.editingCategoryId.set(category.id);
    this.categoryForm.setValue({
      name: category.name,
      description: category.description ?? '',
      status: category.is_active ? 'active' : 'inactive',
    });
    this.drawerVisible.set(true);
  }

  protected closeDrawer(): void {
    if (this.saving()) {
      return;
    }

    this.drawerVisible.set(false);
  }

  protected submitCategory(): void {
    if (this.saving()) {
      return;
    }

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.message.warning('Please fill all required fields correctly.');
      return;
    }

    const raw = this.categoryForm.getRawValue();
    const payload: CreateCategoryPayload = {
      name: (raw.name ?? '').trim(),
      description: raw.description?.trim() ? raw.description : null,
      is_active: raw.status === 'active',
    };

    const request$ = this.editingCategoryId()
      ? this.catalogService.updateCategory(
          this.editingCategoryId() as string,
          payload as UpdateCategoryPayload
        )
      : this.catalogService.createCategory(payload);

    this.saving.set(true);
    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.drawerVisible.set(false);
          this.message.success(this.isEditing() ? 'Category updated successfully.' : 'Category created successfully.');
          this.loadCategories();
        },
        error: (error: Error) => {
          this.errorText.set(error.message || 'Failed to save category');
          this.message.error(error.message || 'Failed to save category');
        },
      });
  }

  protected deleteCategory(categoryId: string): void {
    this.catalogService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.message.success('Category deleted successfully.');
        this.loadCategories();
      },
      error: (error: Error) => {
        this.errorText.set(error.message || 'Failed to delete category');
        this.message.error(error.message || 'Failed to delete category');
      },
    });
  }

  protected confirmDeleteCategory(category: Category): void {
    this.modal.confirm({
      nzTitle: 'Delete category?',
      nzContent: `Are you sure you want to delete "${category.name}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => this.deleteCategory(category.id),
    });
  }

  private detectMobileViewport(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth < 992 : false;
  }
}
