import express from "express";
import { ValidationError, validationResult } from "express-validator";

import { ApiError } from "../error";

export function checkValidation(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  try {
    validationResult(req).throw();
  } catch (error) {
    throw new ApiError(
      400,
      error.errors
        .map(
          (e: ValidationError) =>
            `${e.param}: ${JSON.stringify(e.value)} is invalid`
        )
        .join("; ")
    );
  }
  next();
}
