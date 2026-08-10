/**
 * HTTP error type that the central error middleware (`middleware/errorHandler`)
 * turns into the API's failure envelope. Service layers throw these instead of
 * returning `res` objects, so business logic stays HTTP-free and testable.
 */
export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export const notFound = (message: string) => new HttpError(404, message);
export const forbidden = (message: string) => new HttpError(403, message);
export const badRequest = (message: string) => new HttpError(400, message);
