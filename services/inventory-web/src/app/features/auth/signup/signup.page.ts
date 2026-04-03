import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { BANGLADESH_MOBILE_NUMBER_VALIDATORS } from '../../../shared/validators/phone.validators';

const matchPasswordValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value
    ? null
    : { passwordMismatch: true };
};

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
  ],
  templateUrl: './signup.page.html',
  styleUrl: './signup.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      phone: ['', [...BANGLADESH_MOBILE_NUMBER_VALIDATORS]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [matchPasswordValidator],
    }
  );

  protected submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.warning('Please fill in all fields correctly.');
      return;
    }

    const { email, password, name, phone } = this.form.getRawValue();

    this.loading.set(true);
    this.authService
      .signup({
        email,
        password,
        name: name.trim(),
        phone: phone.trim(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.message.success('Account created successfully. Redirecting...');
          void this.router.navigateByUrl('/');
        },
        error: (error) => {
          this.message.error(this.resolveSignupErrorMessage(error));
        },
      });
  }

  private resolveSignupErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to create account. Please try again.';
    }

    if (error.status === 0) {
      return 'Cannot reach API server. Please check your backend connection.';
    }

    const apiMessage =
      typeof error.error?.error?.message === 'string'
        ? error.error.error.message
        : null;

    if (error.status === 409) {
      return 'This email is already registered. Please use another one.';
    }

    if (error.status === 400) {
      return apiMessage ?? 'Please check email and password format.';
    }

    return apiMessage ?? 'Unable to create account. Please try again.';
  }
}
