import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTableModule } from 'ng-zorro-antd/table';
import type { Category, CreateCategoryPayload, PaginatedResponse } from '../../core/models/catalog.model';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    NzPaginationModule,
    NzPopconfirmModule,
    NzTableModule,
  ],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage {
  private readonly catalogService = inject(CatalogService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly categories = signal<Category[]>([]);
  protected readonly totalCategories = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);
  protected readonly modalVisible = signal(false);
  protected readonly editingCategoryId = signal<string | null>(null);
  protected readonly errorText = signal('');

  protected readonly isEditing = computed(() => Boolean(this.editingCategoryId()));

  protected readonly filterForm = this.formBuilder.group({
    search: [''],
  });

  protected readonly categoryForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  constructor() {
    this.loadCategories();
  }

  protected loadCategories(): void {
    this.loading.set(true);
    this.errorText.set('');

    const { search } = this.filterForm.getRawValue();

    this.catalogService
      .listCategories({
        page: this.page(),
        pageSize: this.pageSize(),
        search: search ?? undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<Category>) => {
          this.categories.set(response.items);
          this.totalCategories.set(response.total);
        },
        error: (error: Error) => {
          this.errorText.set(error.message || 'Failed to load categories');
        },
      });
  }

  protected onApplyFilters(): void {
    this.page.set(1);
    this.loadCategories();
  }

  protected onResetFilters(): void {
    this.filterForm.reset({ search: '' });
    this.page.set(1);
    this.loadCategories();
  }

  protected onPageChange(nextPage: number): void {
    this.page.set(nextPage);
    this.loadCategories();
  }

  protected openCreateModal(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ name: '', description: '' });
    this.modalVisible.set(true);
  }

  protected openEditModal(category: Category): void {
    this.editingCategoryId.set(category.id);
    this.categoryForm.setValue({
      name: category.name,
      description: category.description ?? '',
    });
    this.modalVisible.set(true);
  }

  protected submitCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const raw = this.categoryForm.getRawValue();
    const payload: CreateCategoryPayload = {
      name: raw.name ?? '',
      description: raw.description?.trim() ? raw.description : null,
    };

    const request$ = this.editingCategoryId()
      ? this.catalogService.updateCategory(this.editingCategoryId() as string, payload)
      : this.catalogService.createCategory(payload);

    request$.subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.loadCategories();
      },
      error: (error: Error) => {
        this.errorText.set(error.message || 'Failed to save category');
      },
    });
  }

  protected deleteCategory(categoryId: string): void {
    this.catalogService.deleteCategory(categoryId).subscribe({
      next: () => this.loadCategories(),
      error: (error: Error) => {
        this.errorText.set(error.message || 'Failed to delete category');
      },
    });
  }
}
