// Define shared state variables
export let currentUser = null;
export let currentSelectedEntry = null;
export let base64String = null;
export let path = null;

// Functions to update the shared state variables
export function setCurrentUser(user) {
  currentUser = user;
}

export function setCurrentSelectedEntry(entry) {
  currentSelectedEntry = entry;
}

export function setBase64String(base64Str) {
  base64String = base64Str;
}

export function setPath(newPath) {
  path = newPath;
}

// Optionally, getter functions for better encapsulation
export function getCurrentUser() {
  return currentUser;
}

export function getCurrentSelectedEntry() {
  return currentSelectedEntry;
}

export function getBase64String() {
  return base64String;
}

export function getPath() {
  return path;
}
