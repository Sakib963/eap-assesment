import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard, roleGuard } from './core/guards/auth.guard';

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
				canActivate: [roleGuard(['manager', 'salesman'])],
				loadComponent: () =>
					import('./features/products/products.page').then((m) => m.ProductsPage),
				title: 'Products',
			},
			{
				path: 'users',
				canActivate: [roleGuard(['manager'])],
				loadComponent: () =>
					import('./features/users/users.page').then((m) => m.UsersPage),
				title: 'Users',
			},
			{
				path: 'categories',
				canActivate: [roleGuard(['manager'])],
				loadComponent: () =>
					import('./features/categories/categories.page').then((m) => m.CategoriesPage),
				title: 'Categories',
			},
			{
				path: 'orders/create',
				canActivate: [roleGuard(['manager', 'salesman'])],
				loadComponent: () =>
					import('./features/orders/create/orders-create.page').then((m) => m.OrdersCreatePage),
				title: 'Create Order',
			},
			{
				path: 'orders/:id',
				canActivate: [roleGuard(['manager', 'salesman'])],
				loadComponent: () =>
					import('./features/orders/view/orders-view.page').then((m) => m.OrdersViewPage),
				title: 'Order View',
			},
			{
				path: 'orders',
				canActivate: [roleGuard(['manager', 'salesman'])],
				loadComponent: () =>
					import('./features/orders/list/orders.page').then((m) => m.OrdersPage),
				title: 'Orders',
			},
			{
				path: 'restock',
				canActivate: [roleGuard(['manager'])],
				loadComponent: () =>
					import('./features/restock/restock.page').then((m) => m.RestockPage),
				title: 'Restock Queue',
			},
			{
				path: 'activity',
				canActivate: [roleGuard(['manager'])],
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
		path: 'auth/signup',
		loadComponent: () =>
			import('./features/auth/signup/signup.page').then((m) => m.SignupPage),
		title: 'Sign Up',
		canActivate: [guestOnlyGuard],
	},
	{
		path: 'auth/forgot-password',
		loadComponent: () =>
			import('./features/auth/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
		title: 'Forgot Password',
		canActivate: [guestOnlyGuard],
	},
	{
		path: '**',
		redirectTo: '',
	},
];
