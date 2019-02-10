const { omit } = require("lodash");

const REST_ERROR_CODES = {
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",

  VALIDATION_ERROR: "VALIDATION_ERROR",

  NOT_FOUND: "NOT_FOUND",

  INVALID_CREDENTIALS: "INVALID_CREDENTIALS"
};

function sendError(res, err) {
  if (!err.status || !err.code) {
    const apiErr = new RestApiError(err);
    return res.status(apiErr.status).json(apiErr);
  }

  return res.status(err.status).json(omit(err, "status"));
}

class RestApiError extends Error {
  constructor(message, status, code) {
    super();

    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.message =
      message || "Something went wrong on our end. Please try again.";
    this.code = code || REST_ERROR_CODES.INTERNAL_SERVER_ERROR;
    this.status = status || 500;
  }
}

class ValidationError extends RestApiError {
  constructor(message, code) {
    super(
      message || "Validation on inputs failed!",
      400,
      code || REST_ERROR_CODES.VALIDATION_ERROR
    );
  }
}

class NotFoundError extends RestApiError {
  constructor(message, code) {
    super(
      message || "Unable to retrieve the requested resource.",
      404,
      code || REST_ERROR_CODES.NOT_FOUND
    );
  }
}

module.exports = {
  REST_ERROR_CODES,

  RestApiError,
  NotFoundError,
  ValidationError,

  sendError
};
