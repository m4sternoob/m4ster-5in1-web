/* Single source of truth for the links that appear across the site.
   Only public, intentionally-shared values live here — no secrets. */

export const GITHUB_USER = "m4sternoob";
export const REPO = "guessing-game-gui";
export const GITHUB_URL = `https://github.com/${GITHUB_USER}/${REPO}`;
export const RELEASES_URL = `${GITHUB_URL}/releases`;
export const CONTACT_EMAIL = "masternoob102030@gmail.com";

export const SYS_REQUIREMENTS = {
  os: "macOS 14+",
  chip: "Apple Silicon (arm64)",
  signing: "ad-hoc signed",
} as const;
