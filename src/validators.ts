import { CustomValidator, Meta } from "express-validator";
import { tryGeometry } from "pure-geojson-validation";

export const isIsoDate: CustomValidator = (value: string) =>
  /^\d{4}-[01]\d-[0-3]\d/.test(value);

export const isIsoTime: CustomValidator = (value: string) =>
  /^[0-2]\d:[0-5]\d$/.test(value);

export const isOptionalIsoTime: CustomValidator = (
  value: string,
  meta: Meta
) => {
  return value === "" || isIsoTime(value, meta);
};

export const isTimeZone: CustomValidator = (value: string) => {
  // Raises an exception if value is not valid timeZone.
  Intl.DateTimeFormat(undefined, { timeZone: value });
  return true;
};

export const isLineStringGeometry: CustomValidator = (value: object) => {
  const geometry = tryGeometry(value);
  return geometry.type === "LineString";
};

// Empty arrays will pass this validator. Use .notEmpty in addition if you want
// a non-empty array of numbers.
export const isArrayOfNumbers: CustomValidator = (value) =>
  Array.isArray(value) && !value.some((element) => typeof element !== "number");
