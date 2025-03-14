export enum USERNAME_VALIDATE {
  MIN = 4,
  MAX = 30,
}
export const USERNAME_PATTERN = /^(?=.*[a-zA-Z])[a-zA-Z0-9_.]+$/;

export enum PASSWORD_VALIDATE {
  MIN = 8,
  MAX = 20,
}
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
