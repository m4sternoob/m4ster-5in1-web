/* True only on TEST builds (NEXT_PUBLIC_TEST_BUILD=1 at build time).
   Production builds are completely unaffected. */
export const IS_TEST_BUILD = process.env.NEXT_PUBLIC_TEST_BUILD === "1";
export const TEST_SUFFIX = IS_TEST_BUILD ? " — Test" : "";
