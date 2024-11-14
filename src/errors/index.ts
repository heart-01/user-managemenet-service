/* eslint-disable max-classes-per-file */
export class ResponseError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ResponseError.prototype);
  }

  toJSON() {
    return this.message;
  }
}

export class RecordNotFoundError extends Error {
  constructor(message: string | null) {
    super(message || 'Record not found');
  }

  toJSON() {
    return this.message;
  }
}

export class ConflictError extends Error {
  constructor(message: string | null) {
    super(message || 'Conflict');
  }

  toJSON() {
    return this.message;
  }
}

export class GoogleIdTokenMissingScopeError extends Error {
  constructor() {
    super('Scope is missing. required scope: sub, email, name');
  }

  toJSON() {
    return this.message;
  }
}

export class AuthProviderMismatchException extends Error {
  constructor() {
    super('incorrect authentication provider.');
  }

  toJSON() {
    return this.message;
  }
}
