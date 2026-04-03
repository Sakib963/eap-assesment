import type { UserRole } from '../../core/models/auth.model';

export interface ShellNavigationItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  roles?: UserRole[];
}

export const SHELL_NAVIGATION_ITEMS: ShellNavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: 'home',
    exact: true,
    roles: ['manager', 'salesman'],
  },
  {
    label: 'Users',
    path: '/users',
    icon: 'team',
    roles: ['manager'],
  },
  {
    label: 'Categories',
    path: '/categories',
    icon: 'tags',
    roles: ['manager'],
  },
  {
    label: 'Products',
    path: '/products',
    icon: 'appstore',
    roles: ['manager', 'salesman'],
  },
  {
    label: 'Orders',
    path: '/orders',
    icon: 'shopping-cart',
    roles: ['manager', 'salesman'],
  },
  {
    label: 'Restock Queue',
    path: '/restock',
    icon: 'inbox',
    roles: ['manager'],
  },
  {
    label: 'Activity',
    path: '/activity',
    icon: 'history',
    roles: ['manager'],
  },
];
