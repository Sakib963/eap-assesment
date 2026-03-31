import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';

export interface SharedFilterOption {
  label: string;
  value: string;
}

export interface SharedFilterField {
  key: string;
  label: string;
  type: 'search' | 'select';
  placeholder?: string;
  options?: SharedFilterOption[];
  allowClear?: boolean;
  defaultValue?: string;
}

@Component({
  selector: 'app-shared-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
  ],
  templateUrl: './filter-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedFilterPanelComponent implements OnChanges, OnDestroy {
  private readonly subscriptions: Subscription[] = [];

  @Input({ required: true }) title = 'Filters';
  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) fields: SharedFilterField[] = [];
  @Input() searchDebounceMs = 350;

  @Output() filtersChange = new EventEmitter<Record<string, unknown>>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['form'] || changes['fields']) {
      this.setupSubscriptions();
    }
  }

  ngOnDestroy(): void {
    this.teardownSubscriptions();
  }

  protected resetFilters(): void {
    const defaults = this.fields.reduce<Record<string, unknown>>((acc, field) => {
      acc[field.key] = field.defaultValue ?? '';
      return acc;
    }, {});

    this.form.reset(defaults, { emitEvent: false });
    this.emitFilters();
  }

  private setupSubscriptions(): void {
    this.teardownSubscriptions();

    if (!this.form || !this.fields?.length) {
      return;
    }

    for (const field of this.fields) {
      const control = this.form.get(field.key);
      if (!(control instanceof FormControl)) {
        continue;
      }

      const stream = field.type === 'search'
        ? control.valueChanges.pipe(debounceTime(this.searchDebounceMs), distinctUntilChanged())
        : control.valueChanges.pipe(distinctUntilChanged());

      const subscription = stream.subscribe(() => this.emitFilters());
      this.subscriptions.push(subscription);
    }
  }

  private emitFilters(): void {
    this.filtersChange.emit(this.form.getRawValue());
  }

  private teardownSubscriptions(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions.length = 0;
  }
}
