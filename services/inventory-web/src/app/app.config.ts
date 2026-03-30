import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authTokenInterceptor, httpErrorInterceptor])),
    provideAnimations(),
    provideNzI18n(en_US),
    provideRouter(routes)
  ]
};
