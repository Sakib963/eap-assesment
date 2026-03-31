import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { SHELL_NAVIGATION_ITEMS } from './shell.navigation';

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
    NzDrawerModule,
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

  protected readonly menuItems = SHELL_NAVIGATION_ITEMS;
  protected readonly collapsed = signal(false);
  protected readonly isMobile = signal(this.detectMobileViewport());
  protected readonly mobileMenuVisible = signal(false);
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
      return 'Open menu';
    }
    return this.collapsed() ? 'Expand' : 'Collapse';
  });

  constructor() {
    this.collapsed.set(this.isMobile());
    this.updateBreadcrumbs();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumbs();
        if (this.isMobile()) {
          this.mobileMenuVisible.set(false);
        }
      });
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    const mobile = this.detectMobileViewport();
    this.isMobile.set(mobile);

    if (mobile) {
      this.collapsed.set(true);
      return;
    }

    this.collapsed.set(false);
    this.mobileMenuVisible.set(false);
  }

  protected toggleSider(): void {
    if (this.isMobile()) {
      this.mobileMenuVisible.set(true);
      return;
    }

    this.collapsed.update((value) => !value);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuVisible.set(false);
  }

  protected onSiderBreakpoint(event: boolean | Event): void {
    const isBroken = typeof event === 'boolean' ? event : false;
    this.isMobile.set(this.detectMobileViewport() || isBroken);
    this.collapsed.set(this.isMobile() ? true : false);

    if (!this.isMobile()) {
      this.mobileMenuVisible.set(false);
    }
  }

  private detectMobileViewport(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth < 992 : false;
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth/login');
  }

  private updateBreadcrumbs(): void {
    const cleanUrl = (this.router.url.split(/[?#]/)[0] || '/').trim();
    const sortedItems = [...this.menuItems].sort((a, b) => b.path.length - a.path.length);
    const matched = sortedItems.find((item) => {
      if (item.path === '/') {
        return cleanUrl === '/';
      }

      return cleanUrl === item.path || cleanUrl.startsWith(`${item.path}/`);
    });

    this.breadcrumbs.set([matched?.label || 'Dashboard']);
  }
}
