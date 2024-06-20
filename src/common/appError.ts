export class AppError extends Error {
  constructor(
    public message: string,
    private statusCode: number,
    private status: string,
    private isOperational: boolean,
  ) {
    super(message);
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
