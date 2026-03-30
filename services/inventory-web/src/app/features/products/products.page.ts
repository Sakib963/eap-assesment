import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [NzButtonModule, NzCardModule, NzTableModule, NzTagModule],
  templateUrl: './products.page.html',
  styleUrl: './products.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  protected readonly products = [
    { name: 'Laptop Pro 15', category: 'Electronics', stock: 8, threshold: 5, status: 'active' },
    { name: 'Wireless Mouse', category: 'Electronics', stock: 3, threshold: 20, status: 'low' },
    { name: 'A4 Paper Ream', category: 'Office Supplies', stock: 0, threshold: 10, status: 'out' },
  ];
}
