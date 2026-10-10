/* Single source of truth for the links that appear across the site.
   Only public, intentionally-shared values live here — no secrets. */

export const GITHUB_USER = "m4sternoob";
export const REPO = "m4ster-5in1";
export const GITHUB_URL = `https://github.com/${GITHUB_USER}/${REPO}`;
export const RELEASES_URL = `${GITHUB_URL}/releases`;
export const ANDROID_RELEASES_URL = `https://github.com/${GITHUB_USER}/m4ster-5in1-android/releases`;
export const CONTACT_EMAIL = "xyaz@gmail.com";

export const SYS_REQUIREMENTS = {
  os: "macOS 14+",
  chip: "Apple Silicon (arm64)",
  signing: "ad-hoc signed",
} as const;
