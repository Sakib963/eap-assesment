import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, NzAlertModule, NzButtonModule, NzCardModule, NzFormModule, NzInputModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly feedbackType = signal<'success' | 'error' | null>(null);
  protected readonly feedbackMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['demo@inventory.local', [Validators.required, Validators.email]],
    password: ['demo123', [Validators.required, Validators.minLength(6)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.feedbackType.set(null);
    this.feedbackMessage.set('');
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.feedbackType.set('success');
        this.feedbackMessage.set('Login successful. Redirecting...');
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.loading.set(false);
        this.feedbackType.set('error');
        this.feedbackMessage.set('Login failed. Please verify credentials.');
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  protected loginAsDemo(): void {
    this.loading.set(true);
    this.feedbackType.set(null);
    this.feedbackMessage.set('');
    this.authService.demoLogin().subscribe({
      next: () => {
        this.feedbackType.set('success');
        this.feedbackMessage.set('Demo login successful. Redirecting...');
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.loading.set(false);
        this.feedbackType.set('error');
        this.feedbackMessage.set('Demo login failed. Ensure demo seed data exists.');
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }
}
