export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, statusMessage: string) {
    super(statusMessage);
    this.statusCode = statusCode;
  }
}
