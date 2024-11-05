export class RecordNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, RecordNotFoundError.prototype);
  }

  toJSON() {
    return { message: this.message };
  }
}
