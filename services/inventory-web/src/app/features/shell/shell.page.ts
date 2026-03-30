import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell-page',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzButtonModule,
    NzLayoutModule,
    NzMenuModule,
    NzTagModule,
  ],
  templateUrl: './shell.page.html',
  styleUrl: './shell.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly collapsed = signal(false);
  protected readonly user = this.authService.user;

  protected toggleSider(): void {
    this.collapsed.update((value) => !value);
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth/login');
  }
}
