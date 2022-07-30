import { CustomValidator } from "express-validator";
import { tryGeometry } from "pure-geojson-validation";
import validator from "validator";

export const isIsoDate: CustomValidator = (value: string) =>
  /^\d{4}-[01]\d-[0-3]\d/.test(value);

export const isIsoTime: CustomValidator = (value: string) =>
  /^[0-2]\d:[0-5]\d$/.test(value);

export const isTimeZone: CustomValidator = (value: string) => {
  // Raises an exception if value is not valid timeZone.
  Intl.DateTimeFormat(undefined, { timeZone: value });
  return true;
};

export const isLineStringGeometry: CustomValidator = (value: object) => {
  const geometry = tryGeometry(value);
  return geometry.type === "LineString";
};

export const isArrayOfNumbers: CustomValidator = (value) =>
  Array.isArray(value) &&
  !value.some((element) => !validator.isNumeric(element));
