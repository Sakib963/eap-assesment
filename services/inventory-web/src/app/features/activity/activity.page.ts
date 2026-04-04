import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { SharedFilterField, SharedFilterPanelComponent } from '../../shared/components/filter-panel/filter-panel.component';
import { OrdersService } from '../../core/services/orders.service';
import type { ActivityLogEntry } from '../../core/models/orders.model';

@Component({
  selector: 'app-activity-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzCardModule,
    NzPaginationModule,
    NzTimelineModule,
    NzSpinModule,
    SharedFilterPanelComponent,
  ],
  templateUrl: './activity.page.html',
  styleUrl: './activity.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPage implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly loading = signal(true);
  protected readonly activities = signal<ActivityLogEntry[]>([]);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly total = signal(0);

  protected readonly filterForm = this.formBuilder.group({
    dateRange: [null as [Date, Date] | null],
  });

  protected readonly filterFields: SharedFilterField[] = [
    {
      key: 'dateRange',
      label: 'Activity Date Range',
      type: 'date-range',
      placeholder: 'Select date range',
      defaultValue: null,
    },
  ];

  ngOnInit(): void {
    this.loadActivities();
  }

  protected onFiltersChange(): void {
    this.page.set(1);
    this.loadActivities();
  }

  protected onPageIndexChange(nextPage: number): void {
    this.page.set(nextPage);
    this.loadActivities();
  }

  protected onPageSizeChange(nextPageSize: number): void {
    this.pageSize.set(nextPageSize);
    this.page.set(1);
    this.loadActivities();
  }

  protected formatDateTime(isoString: string): string {
    try {
      return new Date(isoString).toLocaleString([], {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  private loadActivities(): void {
    this.loading.set(true);

    const { dateRange } = this.filterForm.getRawValue();

    this.ordersService
      .getActivityLogs({
        page: this.page(),
        pageSize: this.pageSize(),
        fromDate: dateRange?.[0] ? this.formatDateParam(dateRange[0]) : undefined,
        toDate: dateRange?.[1] ? this.formatDateParam(dateRange[1]) : undefined,
      })
      .subscribe({
      next: (response) => {
        this.activities.set(response.items);
        this.total.set(response.total);
        this.page.set(response.page);
        this.pageSize.set(response.pageSize);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private formatDateParam(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
