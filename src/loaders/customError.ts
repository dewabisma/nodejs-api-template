import { StatusCodes } from '../constants/statusCode.js';

class CustomAPIError extends Error {
  statusCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR;

  constructor(message) {
    super(message);
  }
}

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

class ConflictError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.CONFLICT;
  }
}

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

class UnauthorizedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

const customErrors = {
  NotFoundError,
  BadRequestError,
  ConflictError,
  CustomAPIError,
  UnauthenticatedError,
  UnauthorizedError,
};

export { customErrors, CustomAPIError };
