let uiRoot: ShadowRoot | Document = document;

export function setRoot(root: ShadowRoot | Document) {
  uiRoot = root;
}

export function getRoot(): ShadowRoot | Document {
  return uiRoot;
}
