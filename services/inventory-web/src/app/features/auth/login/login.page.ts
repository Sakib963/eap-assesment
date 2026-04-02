import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NzButtonModule, NzFormModule, NzIconModule, NzInputModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['demo@inventory.local', [Validators.required, Validators.email]],
    password: ['demo123', [Validators.required, Validators.minLength(6)]],
  });

  protected submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.warning('Please enter valid credentials.');
      return;
    }

    this.loading.set(true);
    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.message.success('Login successful. Redirecting...');
          void this.router.navigateByUrl('/');
        },
        error: (error) => {
          this.message.error(this.resolveLoginErrorMessage(error));
        },
      });
  }

  protected loginAsDemo(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.authService
      .demoLogin()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.message.success('Demo login successful. Redirecting...');
          void this.router.navigateByUrl('/');
        },
        error: (error) => {
          this.message.error(this.resolveDemoLoginErrorMessage(error));
        },
      });
  }

  private resolveLoginErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to login. Please try again.';
    }

    if (error.status === 0) {
      return 'Cannot reach API server. Please check your backend connection.';
    }

    const apiMessage =
      typeof error.error?.error?.message === 'string' ? error.error.error.message : null;

    if (error.status === 401) {
      return 'Invalid email or password.';
    }

    if (error.status === 400) {
      return apiMessage ?? 'Please check email and password format.';
    }

    return apiMessage ?? 'Unable to login. Please try again.';
  }

  private resolveDemoLoginErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to sign in with demo account right now.';
    }

    if (error.status === 0) {
      return 'Cannot reach API server. Please check your backend connection.';
    }

    const apiMessage =
      typeof error.error?.error?.message === 'string' ? error.error.error.message : null;

    return apiMessage ?? 'Unable to sign in with demo account right now.';
  }
}
