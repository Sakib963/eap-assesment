import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-restock-page',
  standalone: true,
  imports: [NzButtonModule, NzCardModule, NzTableModule, NzTagModule],
  templateUrl: './restock.page.html',
  styleUrl: './restock.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestockPage {
  protected readonly queue = [
    { product: 'Wireless Mouse', needed: 25, priority: 'high' },
    { product: 'A4 Paper Ream', needed: 20, priority: 'high' },
    { product: 'Desk Lamp', needed: 5, priority: 'medium' },
  ];
}
