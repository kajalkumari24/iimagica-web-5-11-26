import Profile from "../models/Profile.js";
import { validateRequiredFields, isValidPhone } from "../utils/profileValidation.js";
import imagekit from "../config/imagekit.js";
import path from "path";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import { ensureEligibleFreeTrialForUser } from "./subscriptionController.js";

const IMAGE_MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const EXT_BY_IMAGE_MIME = Object.entries(IMAGE_MIME_BY_EXT).reduce((acc, [ext, mime]) => {
  if (!acc[mime]) acc[mime] = ext;
  return acc;
}, {});

const logProfileUploadFile = (label, file) => {
  // console.debug(label, file ? {
  //   fieldname: file.fieldname,
  //   originalname: file.originalname,
  //   encoding: file.encoding,
  //   mimetype: file.mimetype,
  //   size: file.size,
  //   bufferBytes: Buffer.isBuffer(file.buffer) ? file.buffer.length : 0,
  // } : null);
};

const sanitizeFileNamePart = (value = "profile") =>
  String(value || "profile")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "") || "profile";

const buildImageKitFileName = (file) => {
  const originalName = file?.originalname || "";
  const extFromName = path.extname(originalName).toLowerCase();
  const ext = IMAGE_MIME_BY_EXT[extFromName]
    ? extFromName
    : EXT_BY_IMAGE_MIME[file?.mimetype] || ".jpg";
  const base = sanitizeFileNamePart(path.basename(originalName || "profile", extFromName));
  return `${base}-${Date.now()}${ext}`;
};

const toImageKitPublicId = (filePath = "") =>
  String(filePath || "")
    .replace(/^\/+/, "")
    .replace(/\.[a-zA-Z0-9]+$/, "");

const uploadProfileBuffer = async (file, folder = "profiles") => {
  if (!file?.buffer) return null;

  logProfileUploadFile("profile/upload: req.file", file);

  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new Error("Profile image buffer is missing or empty");
  }

  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = file.mimetype || IMAGE_MIME_BY_EXT[ext];
  const isSupportedImage = Boolean(IMAGE_MIME_BY_EXT[ext] && mime === IMAGE_MIME_BY_EXT[ext]);

  if (!isSupportedImage) {
    throw new Error("Only JPG, JPEG, PNG, and WEBP profile images are allowed");
  }

  const resolvedMime = IMAGE_MIME_BY_EXT[ext];
  const fileName = buildImageKitFileName({ ...file, mimetype: resolvedMime });
  const dataUri = `data:${resolvedMime};base64,${file.buffer.toString("base64")}`;

  try {
    // console.debug("profile/upload: imagekit payload", {
    //   fileName,
    //   folder: `/${folder}`,
    //   mimetype: resolvedMime,
    //   size: file.size,
    //   dataUriPrefix: dataUri.slice(0, 40),
    // });

    const result = await imagekit.files.upload({
      file: dataUri,
      fileName,
      folder: `/${folder}`,
      useUniqueFileName: true,
    });

    // console.debug("profile/upload: imagekit response", {
    //   fileId: result?.fileId,
    //   name: result?.name,
    //   filePath: result?.filePath,
    //   url: result?.url,
    //   mime: result?.mime,
    //   fileType: result?.fileType,
    // });

    return {
      secure_url: result.url,
      url: result.url,
      public_id: toImageKitPublicId(result.filePath || `/${folder}/${fileName}`),
      fileId: result.fileId,
      filePath: result.filePath,
      name: result.name,
    };
  } catch (error) {
    console.error("profile/upload: imagekit error", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      response: error?.response?.data,
      error: error?.error,
      help: error?.help,
    });
    throw error;
  }
};

// Fields per category to map into nested objects
const CATEGORY_FIELDS = {
  political: [
    "partyname",
    "positionname",
    "website",
    "mobile",
    "contact",
    "address",
    "instatext",
    "social_instagram",
    "social_facebook",
    "social_linkedin",
    "social_twitter",
    "social_snapchat",
    "social_youtube",
    "social_telegram",
    "social_discord",
    "showPosition",
    "showWebsite",
    "showMobile",
    "showContact",
    "showAddress",
    "showInstagram",
    "showFacebook",
    "showLinkedIn",
    "showTwitter",
    "showSnapchat",
    "showYouTube",
    "showTelegram",
    "showDiscord",
    "showFax",
  ],
  business: [
    "businessName",
    "businessTagline",
    "designation",
    "website",
    "mobile",
    "contact",
    "address",
    "instatext",
    "social_instagram",
    "social_facebook",
    "social_linkedin",
    "social_twitter",
    "social_snapchat",
    "social_youtube",
    "social_telegram",
    "social_discord",
    "showBusinessName",
    "showBusinessTagline",
    "showWebsite",
    "showMobile",
    "showContact",
    "showAddress",
    "showInstagram",
    "showFacebook",
    "showLinkedIn",
    "showTwitter",
    "showSnapchat",
    "showYouTube",
    "showTelegram",
    "showDiscord",
    "showFax",
  ],
  professional: [
    "categories",
    "businessName",
    "designation",
    "website",
    "address",
    "contact",
    "instatext",
    "social_instagram",
    "social_facebook",
    "social_linkedin",
    "social_twitter",
    "social_snapchat",
    "social_youtube",
    "social_telegram",
    "social_discord",
    "showCategories",
    "showDesignation",
    "showWebsite",
    "showAddress",
    "showContact",
    "showInstagram",
    "showFacebook",
    "showLinkedIn",
    "showTwitter",
    "showSnapchat",
    "showYouTube",
    "showTelegram",
    "showDiscord",
    "showFax",
  ],
  personal: [
    "bio",
    "website",
    "address",
    "contact",
    "gender",
    "religion",
    "instatext",
    "social_instagram",
    "social_facebook",
    "social_linkedin",
    "social_twitter",
    "social_snapchat",
    "social_youtube",
    "social_telegram",
    "social_discord",
    "showProfileImage",
    "showAddress",
    "showWebsite",
    "showBio",
    "showContact",
    "showInstagram",
    "showFacebook",
    "showLinkedIn",
    "showTwitter",
    "showSnapchat",
    "showYouTube",
    "showTelegram",
    "showDiscord",
    "showFax",
  ],
  social: [
    "organization",
    "positionname",
    "website",
    "mobile",
    "address",
    "contact",
    "instatext",
    "social_instagram",
    "social_twitter",
    "social_facebook",
    "social_linkedin",
    "social_snapchat",
    "social_youtube",
    "social_telegram",
    "social_discord",
    "showPosition",
    "showWebsite",
    "showMobile",
    "showAddress",
    "showContact",
    "showInstagram",
    "showTwitter",
    "showFacebook",
    "showLinkedIn",
    "showSnapchat",
    "showYouTube",
    "showTelegram",
    "showDiscord",
    "showFax",
  ],
  brand: [
    "brandName",
    "designation",
    "website",
    "address",
    "contact",
    "social_instagram",
    "social_facebook",
    "social_linkedin",
    "social_twitter",
    "social_snapchat",
    "social_youtube",
    "social_telegram",
    "social_discord",
    "showDesignation",
    "showWebsite",
    "showAddress",
    "showContact",
    "showInstagram",
    "showFacebook",
    "showLinkedIn",
    "showTwitter",
    "showSnapchat",
    "showYouTube",
    "showTelegram",
    "showDiscord",
  ],
};

function normalizeWebsiteUrl(url) {
  if (!url) return url;
  try {
    let s = String(url).trim();
    if (s === "") return "";
    // remove protocol
    s = s.replace(/^https?:\/\//i, "");
    // remove trailing slash
    s = s.replace(/\/+$/g, "");
    // remove leading www if present, we'll normalize below
    s = s.replace(/^www\./i, "");
    // ensure we store with www prefix
    s = `www.${s}`;
    return s.toLowerCase();
  } catch (e) {
    return String(url);
  }
}

// Utility to recursively parse array fields (like categories or selectedDisplayFields)
const parseArrayField = (val) => {
  if (!val) return [];
  let result = val;
  if (typeof result === "string") {
    try {
      result = JSON.parse(result);
    } catch {
      result = result.split(",").map((v) => v.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(result)) {
    const flat = [];
    const queue = [...result];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === null || current === undefined) continue;
      if (Array.isArray(current)) {
        queue.push(...current);
      } else if (typeof current === "string") {
        const cleaned = current.trim();
        if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
          try {
            const parsed = JSON.parse(cleaned);
            queue.push(parsed);
          } catch {
            flat.push(cleaned);
          }
        } else {
          flat.push(cleaned);
        }
      } else {
        flat.push(String(current).trim());
      }
    }
    return [...new Set(flat.filter(Boolean))];
  }
  return typeof result === "string" && result.trim() ? [result.trim()] : [];
};

// Try to find a field (like 'mobile') in top-level or nested category objects.
function findFieldValue(source = {}, fieldName) {
  if (!source || !fieldName) return undefined;
  if (source[fieldName] !== undefined && source[fieldName] !== null) {
    const v = source[fieldName];
    if (typeof v === 'object') {
      // try common inner keys
      const innerKeys = ['mobile', 'phone', 'number', 'value'];
      for (const k of innerKeys) if (v[k]) return v[k];
      return undefined;
    }
    return v;
  }
  const sections = ["political", "business", "professional", "personal", "social"];
  for (const s of sections) {
    const sec = source[s];
    if (!sec) continue;
    // if sec is a JSON string, try parse
    if (typeof sec === "string") {
      try {
        const parsed = JSON.parse(sec);
        if (parsed && typeof parsed === "object" && parsed[fieldName] !== undefined) return parsed[fieldName];
      } catch (e) {
        // ignore
      }
      continue;
    }
    if (typeof sec === "object" && sec[fieldName] !== undefined && sec[fieldName] !== null) {
      const v = sec[fieldName];
      if (typeof v === 'object') {
        const innerKeys = ['mobile', 'phone', 'number', 'value'];
        for (const k of innerKeys) if (v[k]) return v[k];
        return undefined;
      }
      return v;
    }
  }
  return undefined;
}

// ✅ Get profile of logged-in user (returns active profile only)
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }

    let profile = await Profile.findOne({ userId, isActive: true });
    if (!profile) {
      profile = await Profile.findOne({ userId });
      if (profile) {
        profile.isActive = true;
        await profile.save();
      }
    }

    if (!profile) {
      const emptyProfile = {
        email: req.user?.email || "",
        profileType: "",
        file: null,
        name: "",
        mobile: req.user?.phone || "",
        fax: "",
        visibleName: true,
        showMobile: true,
        showFax: true,
        showProfileImage: true,
        authProvider: req.user?.authProvider || "",
        phoneLocked: req.user?.authProvider === "phone" && Boolean(req.user?.phone),
      };
      return res.status(200).json({ profile: emptyProfile, isNew: true });
    }

    const profileData = profile.toObject();
    const phoneLocked = req.user?.authProvider === "phone" && Boolean(req.user?.phone);

    if (phoneLocked) {
      profileData.mobile = req.user.phone;
    } else if (!profileData.mobile && req.user?.phone) {
      profileData.mobile = req.user.phone;
    }

    if (!profileData.email && req.user?.email) {
      profileData.email = req.user.email;
    }

    profileData.authProvider = req.user?.authProvider || "";
    profileData.phoneLocked = phoneLocked;
    const profileType = profileData.profileType;

    if (profileType && profileData[profileType]) {
      Object.keys(profileData[profileType]).forEach(key => {
        const topVal = profileData[key];
        const nestedVal = profileData[profileType][key];
        const isEmpty = topVal === undefined || topVal === null || topVal === "" || (Array.isArray(topVal) && topVal.length === 0);
        if (isEmpty && nestedVal !== undefined && nestedVal !== null && nestedVal !== "") {
          profileData[key] = nestedVal;
        }
      });
    }

    // Always ensure address is at top-level from nested if missing
    if (!profileData.address && profileType && profileData[profileType]?.address) {
      profileData.address = profileData[profileType].address;
    }

    profileData.profiletype = profileData.profileType;
    profileData.public_id = profileData.cloudinary_id;

    // Normalize selectedDisplayFields: treat mobile and contact as same field (mobile)
    if (profileData.selectedDisplayFields && Array.isArray(profileData.selectedDisplayFields)) {
      profileData.selectedDisplayFields = profileData.selectedDisplayFields.map(f => {
        const normalized = String(f || '').toLowerCase();
        if (normalized === 'contact' || normalized === 'mobile') return 'mobile';
        return f;
      });
      // Remove duplicates
      profileData.selectedDisplayFields = [...new Set(profileData.selectedDisplayFields)];
    }

    // Get user subscription info
    const user = await User.findById(userId).select(
      "currentPlan planStartDate planExpiryDate isFreeTrialActive freeTrialStartDate freeTrialExpiryDate subscriptionStatus"
    );

    let subscriptionInfo = null;
    if (user) {
      if (!user.isFreeTrialActive && !user.freeTrialStartDate) {
        await ensureEligibleFreeTrialForUser(user);
      }

      const now = new Date();
      let isFreeTrialActive = false;
      let freeTrialDaysLeft = 0;

      // Get most recent subscription record for the user
      const activeSubscription = await Subscription.findOne({ userId })
        .populate("planId", "name planType billing duration price features")
        .sort({ createdAt: -1 });

      // Determine trial state based on expiry date, even if the stored flag is stale
      const hasTrialPeriod = user.freeTrialStartDate && user.freeTrialExpiryDate;
      if (hasTrialPeriod && user.freeTrialExpiryDate > now) {
        isFreeTrialActive = true;
        freeTrialDaysLeft = Math.ceil((user.freeTrialExpiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (!user.isFreeTrialActive) {
          user.isFreeTrialActive = true;
          user.subscriptionStatus = "trial";
          await user.save();
        }
      } else if (user.isFreeTrialActive && user.freeTrialExpiryDate && user.freeTrialExpiryDate <= now) {
        user.isFreeTrialActive = false;
        user.subscriptionStatus = "expired";
        await user.save();
      }

      // Determine current plan and effective subscription status
      let currentPlan = "free";
      let planDetails = null;
      let expiryDate = null;
      let startDate = null;
      let subscriptionStatus = user.subscriptionStatus || "expired";

      if (isFreeTrialActive) {
        currentPlan = "free_trial";
        expiryDate = user.freeTrialExpiryDate;
        startDate = user.freeTrialStartDate;
        subscriptionStatus = "trial";
      } else if (activeSubscription) {
        planDetails = activeSubscription.planId;
        expiryDate = activeSubscription.expiryDate;
        startDate = activeSubscription.startDate || user.planStartDate;
        if (expiryDate && expiryDate > now) {
          currentPlan = activeSubscription.planType;
          subscriptionStatus = "active";
        } else {
          currentPlan = activeSubscription.planType || "free";
          subscriptionStatus = "expired";
        }
      }

      subscriptionInfo = {
        currentPlan,
        planDetails,
        startDate,
        expiryDate,
        isFreeTrialActive,
        freeTrialDaysLeft,
        subscriptionStatus,
        activeSubscription: activeSubscription || null,
      };
    }

    res.status(200).json({ profile: profileData, subscription: subscriptionInfo });
  } catch (err) {
    console.error("Error in getMyProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(400).json({ message: "User ID not found in token" });

    let profile = await Profile.findOne({ userId, isActive: true });
    if (!profile) {
      profile = await Profile.findOne({ userId });
    }
    if (!profile) {
      profile = new Profile({
        email: req.user?.email,
        mobile: req.user?.phone || "",
        userId,
        isActive: true
      });
    } else if (!profile.isActive) {
      profile.isActive = true;
    }

    const phoneLocked = req.user?.authProvider === "phone" && Boolean(req.user?.phone);

    if (req.body.name !== undefined) profile.name = req.body.name;
    if (phoneLocked) {
      profile.mobile = req.user.phone;
    } else if (req.body.mobile !== undefined) {
      profile.mobile = req.body.mobile;
    }
    if (req.body.email !== undefined) {
      const normalizedEmail = String(req.body.email || "").trim().toLowerCase();

      if (normalizedEmail) {
        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: userId },
        }).select("_id");

        if (existingUser) {
          return res.status(400).json({ message: "Email is already in use" });
        }
      }

      profile.email = normalizedEmail;

      if (normalizedEmail) {
        await User.findByIdAndUpdate(userId, {
          email: normalizedEmail,
          emailVerified: true,
        });
      }
    }
    if (req.body.city !== undefined) profile.city = req.body.city;
    if (req.body.state !== undefined) profile.state = req.body.state;
    if (req.body.country !== undefined) profile.country = req.body.country;
    if (req.body.address !== undefined) {
      profile.address = req.body.address || null;
      // Also save in nested type object so getMyProfile copy works
      const typeForAddr = profile.profileType;
      if (typeForAddr && CATEGORY_FIELDS[typeForAddr]?.includes('address')) {
        if (!profile[typeForAddr]) profile[typeForAddr] = {};
        profile[typeForAddr].address = req.body.address || null;
      }
    }
    if (req.body.gender !== undefined) profile.gender = req.body.gender;
    if (req.body.religion !== undefined) profile.religion = req.body.religion;
    if (req.body.fax !== undefined) profile.fax = req.body.fax;
    if (req.body.birthDate !== undefined) profile.birthDate = req.body.birthDate;
    if (req.body.profileType !== undefined) profile.profileType = req.body.profileType;
    if (req.body.visibleName !== undefined) profile.visibleName = req.body.visibleName;
    if (req.body.showMobile !== undefined) profile.showMobile = req.body.showMobile;
    if (req.body.showFax !== undefined) profile.showFax = req.body.showFax;
    // businessName — save top-level so getMyProfile copy works for all types that use it
    if (req.body.businessName !== undefined) profile.businessName = req.body.businessName;

    // Handle selectedDisplayFields (for non-political profiles)
    if (req.body.selectedDisplayFields !== undefined) {
      try {
        let fields = parseArrayField(req.body.selectedDisplayFields);
        if (Array.isArray(fields)) {
          // Normalize fields: treat mobile and contact as same field
          fields = fields.map(f => {
            const normalized = String(f || '').toLowerCase();
            if (normalized === 'contact' || normalized === 'mobile') return 'mobile';
            return f;
          });
          // Remove duplicates
          profile.selectedDisplayFields = [...new Set(fields)];
        }
      } catch (e) {
        console.error('Error parsing selectedDisplayFields:', e);
        profile.selectedDisplayFields = [];
      }
    }
    // Clear selectedDisplayFields only for political profiles (brand uses popup like others)
    if (req.body.profileType === 'political') {
      profile.selectedDisplayFields = [];
    }

    const type = profile.profileType;
    if (type && req.body) {
      if (!profile[type]) profile[type] = {};

      Object.keys(req.body).forEach(key => {
        if (CATEGORY_FIELDS[type] && CATEGORY_FIELDS[type].includes(key)) {
          let val = req.body[key];
          if (key === "categories") {
            val = parseArrayField(val);
          }
          profile[type][key] = val;
        }
      });
    }

    if (req.file) {
      const result = await uploadProfileBuffer(req.file, "profiles");
      profile.file = result?.secure_url || result?.url || profile.file;
      profile.cloudinary_id = result?.public_id || profile.cloudinary_id;
    } else if (req.body.fileUrl) {
      profile.file = req.body.fileUrl;
      if (req.body.public_id) profile.cloudinary_id = req.body.public_id;
    }

    await profile.save();
    res.status(200).json({ message: "Profile updated successfully", profile: profile.toObject() });
  } catch (error) {
    console.error("Error in updateMyProfile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const createProfile = async (req, res) => {
  try {
    const profileData = req.body;

    // Temporary debug logs to inspect incoming create payload
    try {
      // console.debug("DEBUG createProfile - profileData keys:", Object.keys(profileData || {}));
      // console.debug("DEBUG createProfile - profiletype:", (profileData && profileData.profiletype) || null);
      // if (req.file) console.debug("DEBUG createProfile - req.file:", { originalname: req.file.originalname, size: req.file.size });
    } catch (dbgErr) {
      // console.debug("DEBUG createProfile - logging error:", dbgErr && dbgErr.message);
    }

    // Validate required fields for the declared profile type on create
    const incomingTypeCreate = (
      profileData.profileType || profileData.profiletype || ""
    ).toString().trim().toLowerCase();
    
    console.debug("DEBUG - incomingTypeCreate:", incomingTypeCreate);
    console.debug("DEBUG - profileData.organization:", profileData.organization);
    console.debug("DEBUG - profileData keys:", Object.keys(profileData));
    
    if (incomingTypeCreate) {
      const check = validateRequiredFields(incomingTypeCreate, profileData);
      if (!check.ok) {
        // console.debug("DEBUG - Validation failed:", check.missing);
        return res.status(400).json({ message: `Missing required fields for profiletype '${incomingTypeCreate}': ${check.missing.join(", ")}` });
      }
    }

    // Basic phone validation on create if provided. Check nested fields too.
    const mobileCreateCandidate = findFieldValue(profileData, "mobile") || profileData.mobile;
    if (mobileCreateCandidate && !isValidPhone(mobileCreateCandidate)) {
      return res.status(400).json({ message: "Invalid mobile number format" });
    }

    // Coerce showProfileImage when creating from form-data
    if (typeof profileData.showProfileImage !== "undefined") {
      if (typeof profileData.showProfileImage === "string") {
        profileData.showProfileImage = profileData.showProfileImage === "true" || profileData.showProfileImage === "1";
      } else {
        profileData.showProfileImage = Boolean(profileData.showProfileImage);
      }
    }

    // Coerce showCategories when creating from form-data
    if (typeof profileData.showCategories !== "undefined") {
      if (typeof profileData.showCategories === "string") {
        profileData.showCategories = profileData.showCategories === "true" || profileData.showCategories === "1";
      } else {
        profileData.showCategories = Boolean(profileData.showCategories);
      }
    }

    if (req.file) {
      const result = await uploadProfileBuffer(req.file, "profiles");
      profileData.file = result?.secure_url || result?.url || profileData.file;
      profileData.cloudinary_id = result?.public_id || profileData.cloudinary_id;
    }

    if (profileData.categories) {
      if (typeof profileData.categories === "string") {
        profileData.categories = [profileData.categories.trim()];
      }
    } else {
      profileData.categories = [];
    }

    // Map incoming flat fields into nested category object for create
    const targetCreateType = incomingTypeCreate || (profileData.profileType || profileData.profiletype || "").toString().trim().toLowerCase();
    if (targetCreateType) profileData.profileType = targetCreateType;
    if (targetCreateType && CATEGORY_FIELDS[targetCreateType]) {
      if (!profileData[targetCreateType] || typeof profileData[targetCreateType] !== "object") profileData[targetCreateType] = {};
      CATEGORY_FIELDS[targetCreateType].forEach((field) => {
        if (typeof profileData[field] !== "undefined") {
          let val = profileData[field];
          if (field === "categories") {
            val = parseArrayField(val);
          } else {
            // Normalize arrays/JSON and coerce booleans
            if (Array.isArray(val)) {
              val = val.length ? val[val.length - 1] : val;
            }
            if (typeof val === "string") {
              const s = val.trim();
              if (s.startsWith("[") && s.endsWith("]")) {
                try {
                  const parsed = JSON.parse(s);
                  if (Array.isArray(parsed) && parsed.length) val = parsed[parsed.length - 1];
                } catch (e) {
                  // ignore
                }
              }
              if (val === "true" || val === "1") val = true;
              if (val === "false" || val === "0") val = false;
            }
          }
          profileData[targetCreateType][field] = val;
        }
      });
    }

    // Ensure political show flags are present/coerced on create as well
    if (targetCreateType === "political") {
      const politicalShowKeysCreate = ["showPosition", "showMobile", "showAddress", "showInstagram", "showFacebook", "showLinkedIn", "showTwitter", "showSnapchat", "showYouTube", "showTelegram", "showDiscord"];
      if (!profileData.political || typeof profileData.political !== 'object') profileData.political = profileData.political || {};
      politicalShowKeysCreate.forEach((k) => {
        if (typeof profileData[k] !== 'undefined') {
          let v = profileData[k];
          if (typeof v === 'string') v = v === 'true' || v === '1';
          profileData.political[k] = Boolean(v);
        }
      });
    }

    // Map incoming social link fields into profileData.social using flexible key matching
    if (profileData && Object.keys(profileData).length) {
      const socialKeysCreate = Object.keys(profileData).filter((k) => /instagram|instatext|social_instagram|twitter|social_twitter|facebook|social_facebook|linkedin|social_linkedin|snapchat|social_snapchat|youtube|social_youtube|telegram|social_telegram|discord|social_discord/i.test(k));
      if (socialKeysCreate.length) {
        if (!profileData.social || typeof profileData.social !== "object") profileData.social = {};
        socialKeysCreate.forEach((reqKey) => {
          let val = profileData[reqKey];
          if (Array.isArray(val)) val = val.length ? val[val.length - 1] : undefined;
          if (typeof val === "string") {
            const s = val.trim();
            if (s.startsWith("[") && s.endsWith("]")) {
              try {
                const parsed = JSON.parse(s);
                if (Array.isArray(parsed) && parsed.length) val = parsed[parsed.length - 1];
              } catch (e) {
                // ignore
              }
            }
          }
          const lower = reqKey.toLowerCase();
          if (/instagram|instatext|social_instagram|instagram_text/.test(lower)) {
            profileData.social.instatext = val;
            profileData.instatext = val;
            profileData.social.social_instagram = val;
          } else if (/twitter|social_twitter/.test(lower)) {
            profileData.social.social_twitter = val;
          } else if (/facebook|social_facebook/.test(lower)) {
            profileData.social.social_facebook = val;
          } else if (/linkedin|social_linkedin/.test(lower)) {
            profileData.social.social_linkedin = val;
          } else if (/snapchat|social_snapchat/.test(lower)) {
            profileData.social.social_snapchat = val;
          } else if (/youtube|social_youtube/.test(lower)) {
            profileData.social.social_youtube = val;
          } else if (/telegram|social_telegram/.test(lower)) {
            profileData.social.social_telegram = val;
          } else if (/discord|social_discord/.test(lower)) {
            profileData.social.social_discord = val;
          }
        });
        try {
          console.debug("DEBUG createProfile - matched social keys:", socialKeysCreate);
          console.debug("DEBUG createProfile - profileData.social mapped:", profileData.social);
        } catch (e) {
          /* ignore logging errors */
        }
      }
    }

    // // Debug: show incoming social fields on create and the nested social payload
    // try {
    //   console.debug("DEBUG createProfile - incoming social fields:", {
    //     social_instagram: profileData.social_instagram ?? profileData.instatext,
    //     social_twitter: profileData.social_twitter,
    //     social_facebook: profileData.social_facebook,
    //     social_linkedin: profileData.social_linkedin,
    //     social_snapchat: profileData.social_snapchat,
    //     social_youtube: profileData.social_youtube,
    //     social_telegram: profileData.social_telegram,
    //     social_discord: profileData.social_discord,
    //   });
    //   console.debug("DEBUG createProfile - profileData.social before create:", profileData && profileData.social);
    // } catch (dbgErr) {
    //   console.debug("DEBUG createProfile - debug logging failed:", dbgErr && dbgErr.message);
    // }

    // Remove any other nested category objects from create payload so DB only receives the chosen type
    try {
      const allSections = ["political", "business", "professional", "personal", "social"];
      allSections.forEach((sec) => {
        if (!targetCreateType || sec !== targetCreateType) {
          if (profileData[sec] !== undefined) delete profileData[sec];
        }
      });
    } catch (cleErr) {
      // console.debug("DEBUG createProfile - clearing other sections failed:", cleErr && cleErr.message);
    }

    // Normalize website(s) on create data
    if (profileData.website !== undefined) profileData.website = normalizeWebsiteUrl(profileData.website);
    if (profileData.political && profileData.political.website) profileData.political.website = normalizeWebsiteUrl(profileData.political.website);
    if (profileData.business && profileData.business.website) profileData.business.website = normalizeWebsiteUrl(profileData.business.website);
    if (profileData.professional && profileData.professional.website) profileData.professional.website = normalizeWebsiteUrl(profileData.professional.website);
    if (profileData.personal && profileData.personal.website) profileData.personal.website = normalizeWebsiteUrl(profileData.personal.website);

    // ensure userId present on create when available from auth
    if (!profileData.userId && req.user && (req.user._id || req.user.id)) {
      profileData.userId = req.user._id || req.user.id;
    }

    // If still no userId, return error
    if (!profileData.userId) {
      return res.status(400).json({ message: "User authentication required" });
    }

    // Check if profile exists by userId and profileType to allow multiple profiles
    const existing = await Profile.findOne({
      userId: profileData.userId,
      profileType: targetCreateType
    });
    if (existing) {
      return res.status(400).json({ message: `${targetCreateType} profile already exists. Switch to it or create a different profile type.` });
    }

    // Check if user has any profiles, if not make this one active
    const userProfileCount = await Profile.countDocuments({ userId: profileData.userId });
    if (userProfileCount === 0) {
      profileData.isActive = true;
    }

    // Ensure required political field is present or derivable on create
    try {
      if ((profileData.profileType || "").toString().toLowerCase() === "political") {
        const partyFromNested = profileData.political && profileData.political.partyname;
        const partyFromTop = profileData.partyname || profileData.partyName || profileData.name;
        const party = partyFromNested || partyFromTop || (profileData.name || "");
        if (!party || String(party).trim() === "") {
          return res.status(400).json({ message: "Missing required field 'partyname' for political profile" });
        }
        if (!profileData.political || typeof profileData.political !== 'object') profileData.political = {};
        profileData.political.partyname = profileData.political.partyname || String(party).trim();
      }
    } catch (chkErr) {
      // console.debug("DEBUG createProfile - required-field check failed:", chkErr && chkErr.message);
    }

    const profile = await Profile.create(profileData);
    try {
      const out = profile.toObject ? profile.toObject() : { ...profile };
      out.profiletype = out.profiletype || out.profileType || "";
      out.public_id = out.public_id || out.publicId || out.cloudinary_id || null;
      out.publicId = out.publicId || out.public_id;
      res.status(201).json({ message: "Profile created successfully", profile: out });
    } catch (e) {
      res.status(201).json({ message: "Profile created successfully", profile });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};



export const getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteAllProfiles = async (req, res) => {
  try {
    const result = await Profile.deleteMany({});
    res.status(200).json({
      message: "All profiles deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all profiles for a user
export const getAllMyProfiles = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }

    const profiles = await Profile.find({ userId }).sort({ isActive: -1, createdAt: -1 });
    res.status(200).json({ profiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Switch active profile
export const switchActiveProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { profileId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }

    const profile = await Profile.findOne({ _id: profileId, userId });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    profile.isActive = true;
    await profile.save();

    res.status(200).json({ message: "Profile activated successfully", profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
