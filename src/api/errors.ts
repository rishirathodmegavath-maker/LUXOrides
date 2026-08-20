import type { ApiErrorBody } from "./driver.types";

export class ApiError extends Error {
  code: string;
  status: number;
  body: ApiErrorBody;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.status = body.status;
    this.body = body;
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super("Couldn't reach the server. Check your connection and the backend address.");
    this.name = "NetworkError";
    this.cause = cause;
  }
}
