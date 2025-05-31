export function getElementById<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element with id ${id} not found`);
  return el as T;
}

export function querySelector<T extends Element>(
  parent: ParentNode,
  selector: string
): T {
  const el = parent.querySelector(selector);
  if (!el) {
    throw new Error(`Element with selector '${selector}' not found.`);
  }
  return el as T;
}
