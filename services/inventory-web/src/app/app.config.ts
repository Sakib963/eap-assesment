import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  AppstoreOutline,
  CheckCircleOutline,
  CloseOutline,
  CloseCircleOutline,
  DeleteOutline,
  DownOutline,
  EditOutline,
  ExclamationCircleOutline,
  HistoryOutline,
  HomeOutline,
  InboxOutline,
  LogoutOutline,
  MailOutline,
  ReloadOutline,
  MenuFoldOutline,
  MenuOutline,
  MenuUnfoldOutline,
  PlusOutline,
  UnorderedListOutline,
  ShoppingCartOutline,
  TagsOutline,
  UserOutline,
  WarningOutline,
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
      CheckCircleOutline,
      CloseOutline,
      CloseCircleOutline,
      TagsOutline,
      ShoppingCartOutline,
      InboxOutline,
      HistoryOutline,
      MenuFoldOutline,
      MenuOutline,
      MenuUnfoldOutline,
      UserOutline,
      DownOutline,
      LogoutOutline,
      MailOutline,
      ReloadOutline,
      UnorderedListOutline,
      PlusOutline,
      EditOutline,
      DeleteOutline,
      ExclamationCircleOutline,
      WarningOutline,
    ]),
    provideRouter(routes)
  ]
};
