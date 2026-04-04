import { Validators } from '@angular/forms';
import {
  BANGLADESH_MOBILE_NUMBER_MESSAGE,
  BANGLADESH_MOBILE_NUMBER_REGEX,
} from '../../../../../../shared/phone';

export { BANGLADESH_MOBILE_NUMBER_MESSAGE, BANGLADESH_MOBILE_NUMBER_REGEX };

export const BANGLADESH_MOBILE_NUMBER_VALIDATORS = [
  Validators.required,
  Validators.pattern(BANGLADESH_MOBILE_NUMBER_REGEX),
] as const;
