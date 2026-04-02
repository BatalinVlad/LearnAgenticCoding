/**
 * Spread onto non-credential inputs so password-manager extensions
 * (Bitwarden, 1Password, LastPass, etc.) skip them and avoid overlay bugs.
 * Use string "true" for data-* flags (not boolean) so DOM attributes are
 * predictable; some extension code assumes string-like values.
 */
export const inputAutofillIgnoreProps = {
  autoComplete: 'off',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true',
  'data-dashlane-ignore': 'true',
}
