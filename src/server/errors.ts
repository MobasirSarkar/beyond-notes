/** Errors whose message is safe to show to the user. Anything else is masked. */
export class ActionError extends Error {
  override name = "ActionError";
}

export class NotFoundError extends ActionError {
  constructor(what = "Resource") {
    super(`${what} not found`);
  }
}
