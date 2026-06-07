/** True only when the user explicitly tapped pause (not an OS background suspend). */
let userInitiatedPause = false;

export function markUserPause() {
  userInitiatedPause = true;
}

export function clearUserPause() {
  userInitiatedPause = false;
}

export function consumeUserPause() {
  if (!userInitiatedPause) return false;
  userInitiatedPause = false;
  return true;
}
