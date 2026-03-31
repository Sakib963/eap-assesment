import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell-page',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzAvatarModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzDropDownModule,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzToolTipModule,
  ],
  templateUrl: './shell.page.html',
  styleUrl: './shell.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly collapsed = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly user = this.authService.user;
  protected readonly userDisplayName = computed(() => {
    const email = this.user()?.email?.trim();
    if (!email) {
      return 'Anonymous User';
    }

    const localPart = email.split('@')[0]?.trim();
    if (!localPart) {
      return 'Anonymous User';
    }

    return localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  });
  protected readonly breadcrumbs = signal<string[]>(['Dashboard']);
  protected readonly siderWidth = computed(() => {
    if (this.isMobile()) {
      return 0;
    }
    return this.collapsed() ? 70 : 260;
  });
  protected readonly collapseButtonLabel = computed(() => {
    if (this.isMobile()) {
      return this.collapsed() ? 'Open menu' : 'Close menu';
    }
    return this.collapsed() ? 'Expand' : 'Collapse';
  });

  constructor() {
    this.updateBreadcrumbs();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.updateBreadcrumbs());
  }

  protected toggleSider(): void {
    this.collapsed.update((value) => !value);
  }

  protected onSiderBreakpoint(event: boolean | Event): void {
    const isBroken = typeof event === 'boolean' ? event : false;
    this.isMobile.set(isBroken);
    this.collapsed.set(isBroken);
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth/login');
  }

  private updateBreadcrumbs(): void {
    const labels: string[] = [];
    let currentRoute: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root ?? null;

    while (currentRoute) {
      const routeTitle = currentRoute.routeConfig?.title;
      if (typeof routeTitle === 'string' && routeTitle.trim() && routeTitle !== 'Login') {
        labels.push(routeTitle);
      }
      currentRoute = currentRoute.firstChild ?? null;
    }

    if (!labels.length) {
      labels.push('Dashboard');
    }

    this.breadcrumbs.set(labels);
  }
}
