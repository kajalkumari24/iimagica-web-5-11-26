// Session-scoped UI cache cleanup for consistent logout behavior

export const clearSessionAppState = () => {
  try {
    const keysToRemove = [
      "homeCategoriesCache",
      "homeFestivalsCache",
      "homeScrollY",
      "userAuthorized",
      "adminAuthorized",
    ];
    keysToRemove.forEach((key) => {
      try {
        sessionStorage.removeItem(key);
      } catch {}
    });

    // Remove any prefixed keys
    const prefixes = ["homeSliderScroll:", "imageViewSelected:"];
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (!key) continue;
        if (prefixes.some((p) => key.startsWith(p))) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {}
  } catch (err) {
    console.error("clearSessionAppState error", err);
  }
};

export default { clearSessionAppState };
