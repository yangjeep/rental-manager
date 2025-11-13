export {};

declare global {
  type PagesFunction<Env = Record<string, unknown>, Data extends Record<string, unknown> = Record<string, unknown>> = (
    context: {
      request: Request;
      env: Env;
      params: Record<string, string>;
      waitUntil(promise: Promise<unknown>): void;
      next(): Promise<Response>;
      data: Data;
    }
  ) => Promise<Response> | Response;
}
