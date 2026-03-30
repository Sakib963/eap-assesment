import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [NzCardModule, NzTableModule, NzTagModule],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  protected readonly orders = [
    { id: 'ORD-1001', customer: 'demo@inventory.local', total: 1339.98, status: 'completed' },
    { id: 'ORD-1002', customer: 'demo@inventory.local', total: 1549.97, status: 'pending' },
    { id: 'ORD-1003', customer: 'demo@inventory.local', total: 49.97, status: 'pending' },
  ];
}
