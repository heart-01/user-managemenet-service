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

export const THAI_LETTER_PATTERN = '\u0E01-\u0E2E\u0E30-\u0E3A\u0E40-\u0E4E';
export const ONLY_LETTERS_REGEX = new RegExp(`[^A-Za-z${THAI_LETTER_PATTERN} ]`, 'g');
