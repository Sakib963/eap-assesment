import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
		title: 'Dashboard',
		canActivate: [authGuard],
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
