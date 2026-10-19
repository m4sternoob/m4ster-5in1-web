/* Single source of truth for the links that appear across the site.
   Only public, intentionally-shared values live here — no secrets. */

export const GITHUB_USER = "m4sternoob";
export const REPO = "m4ster-5in1-web";
export const GITHUB_URL = `https://github.com/${GITHUB_USER}/${REPO}`;
export const RELEASES_URL = `${GITHUB_URL}/releases`;

/* Direct binary downloads (latest release) — buttons link straight to the
   files, not the releases page. Bump the tag/filenames on new releases. */
export const WINDOWS_DOWNLOAD_URL = `${GITHUB_URL}/releases/download/v1.0.3/5IN1_0.1.0_x64-setup.exe`;
export const MAC_DOWNLOAD_URL = `${GITHUB_URL}/releases/download/v1.0.3/5IN1_0.1.0_aarch64.dmg`;
export const ANDROID_DOWNLOAD_URL = `${GITHUB_URL}/releases/download/v1.0.3/app-debug.apk`;

export const CONTACT_EMAIL = "xyaz@gmail.com";

export const SYS_REQUIREMENTS = {
  os: "Windows 10+ · macOS 13+ · Android 8+ · iOS 16+",
  chip: "x64 · arm64",
  signing: "open-source builds",
} as const;
