// Simple professional payload validator & sanitizer
// Returns { valid: boolean, errors: [], cleaned: {} }

function toStringSafe(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

export function validateProfessionalPayload(input = {}) {
  const errors = [];
  const cleaned = {};

  // categories: accept array or comma-separated string -> normalize to array
  if (typeof input.categories !== 'undefined') {
    if (Array.isArray(input.categories)) {
      cleaned.categories = input.categories.map((s) => toStringSafe(s)).filter(Boolean);
    } else {
      const raw = toStringSafe(input.categories);
      cleaned.categories = raw === '' ? [] : raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  // designation: optional string, limit length
  if (typeof input.designation !== 'undefined') {
    const d = toStringSafe(input.designation);
    if (d.length > 200) errors.push('designation too long');
    cleaned.designation = d;
  }

  // website: optional string, basic normalization (add https:// when missing)
  if (typeof input.website !== 'undefined') {
    let w = toStringSafe(input.website);
    if (w !== '') {
      if (!/^https?:\/\//i.test(w)) w = `https://${w}`;
    }
    cleaned.website = w;
  }

  // address: optional string
  if (typeof input.address !== 'undefined') {
    cleaned.address = toStringSafe(input.address);
  }

  // show flags: normalize to boolean
  const flags = ['showCategories', 'showDesignation', 'showWebsite', 'showAddress'];
  flags.forEach((f) => {
    if (typeof input[f] !== 'undefined') {
      const v = input[f];
      cleaned[f] = (v === true || v === 'true' || v === '1' || v === 1);
    }
  });

  return { valid: errors.length === 0, errors, cleaned };
}

export default { validateProfessionalPayload };
