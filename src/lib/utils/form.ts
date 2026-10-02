/** Reads a text field from a form, ignoring File entries (never stringifies them). */
export function formText(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value.trim() : "";
}
