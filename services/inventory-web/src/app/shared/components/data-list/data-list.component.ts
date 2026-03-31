import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

export type ListViewMode = 'table' | 'cards';

export interface SharedListColumn<T> {
  key: keyof T | string;
  label: string;
  type?: 'text' | 'currency' | 'tag';
  emptyText?: string;
  formatter?: (item: T) => string;
  tagColor?: (item: T) => string;
}

export interface SharedListAction<T> {
  label: string;
  icon?: string;
  type?: 'default' | 'primary' | 'text' | 'link';
  danger?: boolean;
  confirmTitle?: string;
  visible?: (item: T) => boolean;
  onClick: (item: T) => void;
}

export interface SharedListConfig<T> {
  title: string;
  columns: SharedListColumn<T>[];
  actions?: SharedListAction<T>[];
  defaultView?: ListViewMode;
  cardGridClass?: string;
  emptyText?: string;
  showEmptyState?: boolean;
}

@Component({
  selector: 'app-shared-data-list',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzPaginationModule,
    NzPopconfirmModule,
    NzTableModule,
    NzTagModule,
  ],
  templateUrl: './data-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedDataListComponent<T extends { id?: string }> {
  @Input({ required: true }) config!: SharedListConfig<T>;
  @Input() items: T[] = [];
  @Input() loading = false;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() total = 0;

  @Output() pageChange = new EventEmitter<number>();
  @Output() viewModeChange = new EventEmitter<ListViewMode>();

  protected viewMode: ListViewMode = 'table';
  protected readonly isMobileView = signal(this.detectMobileView());

  ngOnInit(): void {
    this.applyResponsiveViewMode();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.applyResponsiveViewMode();
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.isMobileView.set(this.detectMobileView());
    this.applyResponsiveViewMode();
  }

  protected setViewMode(mode: ListViewMode): void {
    if (this.isMobileView()) {
      this.viewMode = 'cards';
      this.viewModeChange.emit('cards');
      return;
    }

    this.viewMode = mode;
    this.viewModeChange.emit(mode);
  }

  protected onPageIndexChange(nextPage: number): void {
    this.pageChange.emit(nextPage);
  }

  protected serialNumber(index: number): number {
    return (this.page - 1) * this.pageSize + index + 1;
  }

  protected resolveValue(item: T, column: SharedListColumn<T>): string {
    if (column.formatter) {
      return column.formatter(item);
    }

    const rawValue = this.readPath(item, String(column.key));
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return column.emptyText ?? '-';
    }

    if (column.type === 'currency') {
      const value = Number(rawValue);
      return Number.isNaN(value) ? String(rawValue) : `$${value.toFixed(2)}`;
    }

    return String(rawValue);
  }

  protected resolveTagColor(item: T, column: SharedListColumn<T>): string {
    if (!column.tagColor) {
      return 'default';
    }

    return column.tagColor(item);
  }

  protected shouldShowAction(item: T, action: SharedListAction<T>): boolean {
    if (!action.visible) {
      return true;
    }

    return action.visible(item);
  }

  protected actionType(action: SharedListAction<T>): 'default' | 'primary' | 'text' | 'link' {
    return action.type ?? 'default';
  }

  protected actionIconType(action: SharedListAction<T>): string {
    return action.icon?.trim() || '';
  }

  protected cardGridClass(): string {
    return this.config.cardGridClass ?? 'grid-cols-1 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
  }

  private detectMobileView(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth < 992 : false;
  }

  private applyResponsiveViewMode(): void {
    if (this.isMobileView()) {
      this.viewMode = 'cards';
      return;
    }

    this.viewMode = this.config?.defaultView ?? this.viewMode;
  }

  private readPath(source: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[key];
      }

      return undefined;
    }, source);
  }
}
