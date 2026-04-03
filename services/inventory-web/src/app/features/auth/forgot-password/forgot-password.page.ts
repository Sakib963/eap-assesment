import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../core/services/auth.service';

const matchPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('new_password')?.value;
  const confirm = control.get('confirm_password')?.value;
  if (!password || !confirm) {
    return null;
  }
  return password === confirm ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NzCardModule, NzFormModule, NzInputModule, NzButtonModule],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);

  protected readonly step = signal<1 | 2 | 3>(1);
  protected readonly loading = signal(false);
  protected readonly email = signal('');

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly otpForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(10)]],
  });

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]],
    },
    { validators: [matchPasswordValidator] }
  );

  protected goToStep(next: 1 | 2 | 3): void {
    this.step.set(next);
  }

  protected submitEmail(): void {
    if (this.loading()) return;
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.emailForm.getRawValue().email.trim();
    this.loading.set(true);
    this.authService
      .requestForgotPassword({ email })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.email.set(email);
          this.step.set(2);
          this.message.success('Email found. Use OTP 1234 to continue.');
        },
        error: (error: Error) => this.message.error(error.message || 'Unable to verify email'),
      });
  }

  protected submitOtp(): void {
    if (this.loading()) return;
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const otp = this.otpForm.getRawValue().otp.trim();
    this.loading.set(true);
    this.authService
      .verifyForgotPasswordOtp({ email: this.email(), otp })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.step.set(3);
          this.message.success('OTP verified. Set your new password.');
        },
        error: (error: Error) => this.message.error(error.message || 'OTP verification failed'),
      });
  }

  protected submitPasswordReset(): void {
    if (this.loading()) return;
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const otp = this.otpForm.getRawValue().otp.trim();
    const newPassword = this.passwordForm.getRawValue().new_password;

    this.loading.set(true);
    this.authService
      .resetForgotPassword({ email: this.email(), otp, new_password: newPassword })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.message.success('Password updated successfully. Please login.');
          void this.router.navigateByUrl('/auth/login');
        },
        error: (error: Error) => this.message.error(error.message || 'Password reset failed'),
      });
  }
}
