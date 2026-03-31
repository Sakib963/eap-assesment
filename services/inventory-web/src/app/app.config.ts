import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  AppstoreOutline,
  DownOutline,
  HistoryOutline,
  HomeOutline,
  InboxOutline,
  LogoutOutline,
  MailOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  ShoppingCartOutline,
  TagsOutline,
  UserOutline,
} from '@ant-design/icons-angular/icons';
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
    provideNzIcons([
      HomeOutline,
      AppstoreOutline,
      TagsOutline,
      ShoppingCartOutline,
      InboxOutline,
      HistoryOutline,
      MenuFoldOutline,
      MenuUnfoldOutline,
      UserOutline,
      DownOutline,
      LogoutOutline,
      MailOutline,
    ]),
    provideRouter(routes)
  ]
};
