import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import type { PaginatedResponse } from '../../core/models/catalog.model';
import type { UserRecord, UserRole, UserStatus } from '../../core/models/users.model';
import { UsersService } from '../../core/services/users.service';
import { SharedDataListComponent, SharedListConfig } from '../../shared/components/data-list/data-list.component';
import { SharedFilterField, SharedFilterPanelComponent } from '../../shared/components/filter-panel/filter-panel.component';
import { BANGLADESH_MOBILE_NUMBER_VALIDATORS } from '../../shared/validators/phone.validators';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzDrawerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    SharedDataListComponent,
    SharedFilterPanelComponent,
  ],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  protected readonly users = signal<UserRecord[]>([]);
  protected readonly totalUsers = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);

  protected readonly drawerVisible = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingUserId = signal<string | null>(null);
  protected readonly isEditing = computed(() => Boolean(this.editingUserId()));

  protected readonly filterForm = this.fb.group({
    search: [''],
    role: ['' as UserRole | ''],
    status: ['' as UserStatus | ''],
  });

  protected readonly userForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    phone: ['', [...BANGLADESH_MOBILE_NUMBER_VALIDATORS]],
    role: ['salesman' as UserRole, Validators.required],
    status: ['active' as UserStatus, Validators.required],
  });

  protected readonly filterFields: SharedFilterField[] = [
    { key: 'search', label: 'Search', type: 'search', placeholder: 'Email or name', defaultValue: '' },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      placeholder: 'All roles',
      allowClear: true,
      defaultValue: '',
      options: [
        { label: 'Manager', value: 'manager' },
        { label: 'Salesman', value: 'salesman' },
      ],
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

  protected readonly userListConfig: SharedListConfig<UserRecord> = {
    title: 'User List',
    defaultView: 'table',
    cardGridClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    serialColumnWidth: '8%',
    actionsColumnWidth: '15%',
    emptyText: 'No users found.',
    columns: [
      { key: 'email', label: 'Email', width: '24%' },
      { key: 'name', label: 'Name', width: '15%', formatter: (u) => u.name || '-' },
      { key: 'phone', label: 'Phone', width: '15%', formatter: (u) => u.phone || '-' },
      {
        key: 'role',
        label: 'Role',
        width: '12%',
        type: 'tag',
        formatter: (u) => (u.role === 'manager' ? 'Manager' : 'Salesman'),
        tagColor: (u) => (u.role === 'manager' ? 'blue' : 'green'),
      },
      {
        key: 'status',
        label: 'Status',
        width: '12%',
        type: 'tag',
        formatter: (u) => (u.status === 'active' ? 'Active' : 'Inactive'),
        tagColor: (u) => (u.status === 'active' ? 'success' : 'default'),
      },
      { key: 'created_by', label: 'Created By', width: '12%' },
    ],
    actions: [
      {
        label: 'Edit',
        icon: 'edit',
        type: 'default',
        onClick: (user) => this.openEditDrawer(user),
      },
    ],
  };

  constructor() {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading.set(true);
    const { search, role, status } = this.filterForm.getRawValue();

    this.usersService
      .listUsers({
        page: this.page(),
        pageSize: this.pageSize(),
        search: search || undefined,
        role: (role || undefined) as UserRole | undefined,
        status: (status || undefined) as UserStatus | undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PaginatedResponse<UserRecord>) => {
          this.users.set(response.items);
          this.totalUsers.set(response.total);
        },
        error: (error: Error) => this.message.error(error.message || 'Failed to load users'),
      });
  }

  protected onFiltersChange(): void {
    this.page.set(1);
    this.loadUsers();
  }

  protected onPageChange(nextPage: number): void {
    this.page.set(nextPage);
    this.loadUsers();
  }

  protected openCreateDrawer(): void {
    this.editingUserId.set(null);
    this.userForm.reset({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'salesman',
      status: 'active',
    });
    this.drawerVisible.set(true);
  }

  protected openEditDrawer(user: UserRecord): void {
    this.editingUserId.set(user.id);
    this.userForm.reset({
      email: user.email,
      password: '',
      name: user.name ?? '',
      phone: user.phone ?? '',
      role: user.role,
      status: user.status,
    });
    this.drawerVisible.set(true);
  }

  protected closeDrawer(): void {
    if (this.saving()) {
      return;
    }
    this.drawerVisible.set(false);
  }

  protected submitUser(): void {
    if (this.saving()) return;
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.message.warning('Please fill all required user fields.');
      return;
    }

    const raw = this.userForm.getRawValue();
    if (!this.isEditing() && !(raw.password ?? '').trim()) {
      this.message.warning('Password is required when creating a user.');
      return;
    }

    const payload = {
      email: String(raw.email ?? '').trim(),
      ...(raw.password?.trim() ? { password: raw.password.trim() } : {}),
      name: String(raw.name ?? '').trim(),
      phone: String(raw.phone ?? '').trim(),
      role: raw.role as UserRole,
      status: raw.status as UserStatus,
    };

    const request$ = this.isEditing()
      ? this.usersService.updateUser(this.editingUserId() as string, payload)
      : this.usersService.createUser(payload as {
          email: string;
          password: string;
          name: string;
          phone: string;
          role: UserRole;
          status: UserStatus;
        });

    this.saving.set(true);
    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.message.success(this.isEditing() ? 'User updated successfully.' : 'User created successfully.');
          this.drawerVisible.set(false);
          this.loadUsers();
        },
        error: (error: Error) => this.message.error(error.message || 'Failed to save user'),
      });
  }
}
