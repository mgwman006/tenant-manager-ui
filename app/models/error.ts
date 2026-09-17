export type ApiErrorData = {
  message: string;
  details: string | Record<string, string> | null;
  statusCode: number;
};

export class ApiError extends Error {
  statusCode: number;
  details: string | Record<string, string> | null;

  constructor(values: ApiErrorData) {
    super(values.message);
    this.name = "ApiError";
    this.statusCode = values.statusCode;
    this.details = values.details;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}
