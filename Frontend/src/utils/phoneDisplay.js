export const stripCountryCodeForDisplay = (value) => {
  const raw = String(value || "");
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return raw;
};
