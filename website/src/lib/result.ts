export type Ok<T> = { success: true; data: T };
export type Err = {
  success: false;
  error: { message: string; code: string };
};
export type Result<T> = Ok<T> | Err;

export function ok<T>(data: T): Ok<T> {
  return { success: true, data };
}

export function err(message: string, code: string): Err {
  return { success: false, error: { message, code } };
}
