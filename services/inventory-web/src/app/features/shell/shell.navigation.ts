export interface ShellNavigationItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
}

export const SHELL_NAVIGATION_ITEMS: ShellNavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: 'home',
    exact: true,
  },
  {
    label: 'Categories',
    path: '/categories',
    icon: 'tags',
  },
  {
    label: 'Products',
    path: '/products',
    icon: 'appstore',
  },
  {
    label: 'Orders',
    path: '/orders',
    icon: 'shopping-cart',
  },
  {
    label: 'Restock Queue',
    path: '/restock',
    icon: 'inbox',
  },
  {
    label: 'Activity',
    path: '/activity',
    icon: 'history',
  },
];
