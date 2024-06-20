export class AppError extends Error {
  status: string;
  isOperational: boolean;
  constructor(
    public message: string,
    private statusCode: number,
  ) {
    super(message);
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
