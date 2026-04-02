import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		canActivate: [authGuard],
		loadComponent: () => import('./features/shell/shell.page').then((m) => m.ShellPage),
		children: [
			{
				path: '',
				loadComponent: () =>
					import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
				title: 'Dashboard',
			},
			{
				path: 'products',
				loadComponent: () =>
					import('./features/products/products.page').then((m) => m.ProductsPage),
				title: 'Products',
			},
			{
				path: 'categories',
				loadComponent: () =>
					import('./features/categories/categories.page').then((m) => m.CategoriesPage),
				title: 'Categories',
			},
			{
				path: 'orders/create',
				loadComponent: () =>
					import('./features/orders/create/orders-create.page').then((m) => m.OrdersCreatePage),
				title: 'Create Order',
			},
			{
				path: 'orders/:id',
				loadComponent: () =>
					import('./features/orders/view/orders-view.page').then((m) => m.OrdersViewPage),
				title: 'Order View',
			},
			{
				path: 'orders',
				loadComponent: () =>
					import('./features/orders/list/orders.page').then((m) => m.OrdersPage),
				title: 'Orders',
			},
			{
				path: 'restock',
				loadComponent: () =>
					import('./features/restock/restock.page').then((m) => m.RestockPage),
				title: 'Restock Queue',
			},
			{
				path: 'activity',
				loadComponent: () =>
					import('./features/activity/activity.page').then((m) => m.ActivityPage),
				title: 'Activity',
			},
		],
	},
	{
		path: 'auth/login',
		loadComponent: () =>
			import('./features/auth/login/login.page').then((m) => m.LoginPage),
		title: 'Login',
		canActivate: [guestOnlyGuard],
	},
	{
		path: '**',
		redirectTo: '',
	},
];
