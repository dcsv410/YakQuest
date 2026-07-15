import { ApiError } from "./errors";

export type TokenProvider = () => string | null | Promise<string | null>;

export type ApiClientOptions = {
  baseUrl: string;
  tokenProvider?: TokenProvider;
};

export class ApiClient {
  private baseUrl: string;
  private tokenProvider?: TokenProvider;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.tokenProvider = options.tokenProvider;
  }

  async get<TResponse>(path: string): Promise<TResponse> {
    return this.request<TResponse>("GET", path);
  }

  async post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>("POST", path, body);
  }

  async patch<TResponse, TBody = unknown>(
    path: string,
    body?: TBody
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>("PATCH", path, body);
  }

  async delete<TResponse = void>(path: string): Promise<TResponse> {
    return this.request<TResponse>("DELETE", path);
  }

  async deleteWithBody<
    TResponse = void,
    TBody = unknown,
  >(
    path: string,
    body: TBody
  ): Promise<TResponse> {
    return this.request<
      TResponse,
      TBody
    >("DELETE", path, body);
  }

  private async request<TResponse, TBody = unknown>(
    method: string,
    path: string,
    body?: TBody
  ): Promise<TResponse> {
    const token = this.tokenProvider ? await this.tokenProvider() : null;

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new ApiError(
        `API request failed: ${method} ${path}`,
        response.status,
        errorText
      );
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    const text = await response.text();

    if (!text) {
      return undefined as TResponse;
    }

    return JSON.parse(text) as TResponse;
  }
}