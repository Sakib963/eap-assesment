import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import type { HealthResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly api = inject(ApiClientService);

  getHealth(): Observable<HealthResponse> {
    return this.api.get<HealthResponse>('/api/health');
  }

  getDatabaseStatus(): Observable<string> {
    return this.getHealth().pipe(
      map((health) => health.database?.status ?? 'unknown')
    );
  }
}
