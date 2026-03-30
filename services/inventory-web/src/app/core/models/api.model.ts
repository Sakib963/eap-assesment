export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface HealthResponse {
  status: string;
  service: string;
  environment: string;
  database?: {
    status: string;
    message: string;
  };
  timestamp: string;
}
