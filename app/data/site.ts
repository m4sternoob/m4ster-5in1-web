/* Single source of truth for the links that appear across the site.
   Only public, intentionally-shared values live here — no secrets. */

export const GITHUB_USER = "m4sternoob";
export const REPO = "m4ster-5in1-web";
export const GITHUB_URL = `https://github.com/${GITHUB_USER}/${REPO}`;
export const RELEASES_URL = `${GITHUB_URL}/releases`;
export const ANDROID_RELEASES_URL = `${GITHUB_URL}/releases`;
export const WINDOWS_RELEASES_URL = `${GITHUB_URL}/releases`;
export const CONTACT_EMAIL = "xyaz@gmail.com";

export const SYS_REQUIREMENTS = {
  os: "Windows 10+ · macOS 13+ · Android 8+ · iOS 16+",
  chip: "x64 · arm64",
  signing: "open-source builds",
} as const;
