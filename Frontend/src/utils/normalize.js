// Shared normalization helpers for admin UI
// Keep this small and defensive against inconsistent API payloads.

export const getProfileType = (profile) => {
  return profile?.profileType || profile?.profiletype || "";
};

export const normalizeUser = (user = {}) => {
  const email = user.email || user.userId?.email || "";
  const role = user.role || "user";
  const status = user.status || "active";
  const emailVerified = typeof user.emailVerified === "boolean" ? user.emailVerified : false;

  return {
    ...user,
    email,
    role,
    status,
    emailVerified,
  };
};

export const normalizeProfile = (profile = {}) => {
  const profileType = getProfileType(profile);
  return {
    ...profile,
    profileType,
  };
};

export default { normalizeUser, normalizeProfile, getProfileType };
