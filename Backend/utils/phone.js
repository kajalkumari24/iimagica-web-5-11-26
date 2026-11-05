export const normalizePhoneNumber = (value, defaultCountryCode = "91") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `${defaultCountryCode}${digits.slice(1)}`;
  }

  if (digits.length > 10 && digits.length <= 15) {
    return digits;
  }

  return "";
};

export const maskPhoneNumber = (value) => {
  const phone = String(value || "");
  if (phone.length <= 4) return phone;
  return `${phone.slice(0, 3)}${"*".repeat(Math.max(phone.length - 7, 1))}${phone.slice(-4)}`;
};
