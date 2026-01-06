import { HttpException, HttpStatus } from '@nestjs/common'; // Base HTTP exception class and HTTP status codes

/**
 * Exception thrown when a client exceeds the allowed number of requests.
 *
 * This exception maps to HTTP status code 429 (Too Many Requests) and can be
 * used in rate-limiting or throttling scenarios.
 */
export class TooManyRequestsException extends HttpException {
  /**
   * Creates a new TooManyRequestsException.
   *
   * @param message - Optional custom error message describing the rate limit violation
   */
  constructor(message = 'Rate limit exceeded') {
    // Call the base HttpException constructor with message and HTTP 429 status code
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
