import { HttpException, HttpStatus } from '@nestjs/common';

export class TooManyRequestsException extends HttpException {
  constructor(message = 'Rate limit exceeded') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
