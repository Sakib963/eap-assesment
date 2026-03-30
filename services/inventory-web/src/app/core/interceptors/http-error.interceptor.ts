import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        typeof error.error?.error?.message === 'string'
          ? error.error.error.message
          : 'Unexpected request failure';

      console.error(`[HTTP ${req.method}] ${req.url} -> ${message}`);
      return throwError(() => error);
    })
  );
};
