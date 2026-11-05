import { PROFILE_TYPES } from "./profileConstants.js";

// Rules per profile type. Keep small and declarative so it's easy to extend.
const TYPE_RULES = {
  political: { required: ["partyname"] },
  business: { required: ["businessName"] },
  professional: { required: [] },
  personal: { required: [] },
  social: { required: ["organization"] },
};

export function getTypeRules(type) {
  if (!type) return {};
  const t = String(type).trim().toLowerCase();
  return TYPE_RULES[t] || {};
}

export function validateRequiredFields(type, source = {}) {
  const rules = getTypeRules(type);
  if (!rules.required || !rules.required.length) return { ok: true };
  
  console.debug("Validating type:", type, "Required:", rules.required);
  console.debug("Source keys:", Object.keys(source));
  
  const missing = rules.required.filter((f) => {
    // Check top-level
    let v = source[f];
    console.debug(`Checking field '${f}' at top level:`, v);

    // If not present at top-level, check known nested sections
    if (v === undefined || v === null || String(v).trim() === "") {
      const sections = ["political", "business", "professional", "personal", "social"];
      for (const s of sections) {
        if (source[s] && typeof source[s] === "object" && source[s][f] !== undefined && source[s][f] !== null) {
          v = source[s][f];
          console.debug(`Found '${f}' in section '${s}':`, v);
          break;
        }
      }
    }

    const isMissing = v === undefined || v === null || String(v).trim() === "";
    if (isMissing) console.debug(`Field '${f}' is MISSING`);
    return isMissing;
  });
  
  if (missing.length) {
    console.debug("Missing fields:", missing);
    return { ok: false, missing };
  }
  return { ok: true };
}

// Lightweight phone validation fallback. For production use, prefer libphonenumber-js.
export function isValidPhone(phone) {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export default { getTypeRules, validateRequiredFields, isValidPhone };
