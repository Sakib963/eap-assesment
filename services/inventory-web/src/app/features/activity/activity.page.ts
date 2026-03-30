import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

@Component({
  selector: 'app-activity-page',
  standalone: true,
  imports: [NzCardModule, NzTimelineModule],
  templateUrl: './activity.page.html',
  styleUrl: './activity.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPage {
  protected readonly activities = [
    'Order ORD-1003 created and stock deducted',
    'Restock queue item generated for A4 Paper Ream',
    'Product Wireless Mouse stock updated to 3',
    'Demo login performed by demo@inventory.local',
  ];
}
