import { ApiItem } from '../cognito/types';

export interface RequestParams {
  body?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  headers?: { string: string };
  responseType?: string;
  timeout?: number;
}

export interface ApiConfig {
  entryPoint: string;
  apis: ApiItem[];
}
