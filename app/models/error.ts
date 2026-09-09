export type ApiErrorData = {
  message: string;
  data: string | Record<string, string> | null;
  statusCode: number;
};

export class ApiError extends Error {
  statusCode: number;
  details: string | Record<string, string> | null;

  constructor(values: ApiErrorData) {
    super(values.message);
    this.name = "ApiError";
    this.statusCode = values.statusCode;
    this.details = values.data;
  }
}
