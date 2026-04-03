import { Validators } from '@angular/forms';

export const BANGLADESH_MOBILE_NUMBER_REGEX = /^01[3-9][0-9]{8}$/;

export const BANGLADESH_MOBILE_NUMBER_MESSAGE =
  'Phone number must be 11 digits and start with 013, 014, 015, 016, 017, 018, or 019.';

export const BANGLADESH_MOBILE_NUMBER_VALIDATORS = [
  Validators.required,
  Validators.pattern(BANGLADESH_MOBILE_NUMBER_REGEX),
] as const;
