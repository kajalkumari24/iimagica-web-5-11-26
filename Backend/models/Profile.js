import mongoose from "mongoose";

const { Schema } = mongoose;
const boolTrue = { type: Boolean, default: true };


// PERSONAL
const PersonalSchema = new Schema(
  {
    bio: String,
    website: String,
    address: String,
    contact: String,
    social_instagram: String,
    social_facebook: String,
    social_linkedin: String,
    social_twitter: String,
    social_snapchat: String,
    social_youtube: String,
    social_telegram: String,
    social_discord: String,
  
    showBio: boolTrue,
    showWebsite: boolTrue,
    showAddress: boolTrue,
    showContact: boolTrue,
    showInstagram: boolTrue,
    showFacebook: boolTrue,
    showLinkedIn: boolTrue,
    showTwitter: boolTrue,
    showSnapchat: boolTrue,
    showYouTube: boolTrue,
    showTelegram: boolTrue,
    showDiscord: boolTrue,
    showFax: boolTrue,
  },
  { _id: false }
);

// PROFESSIONAL
const ProfessionalSchema = new Schema(
  {
    categories: { type: [String], default: [] },
    businessName: String,
    designation: String,
    website: String,
    address: String,
    contact: String,
    social_instagram: String,
    social_facebook: String,
    social_linkedin: String,
    social_twitter: String,
    social_snapchat: String,
    social_youtube: String,
    social_telegram: String,
    social_discord: String,

    showCategories: boolTrue,
    showDesignation: boolTrue,
    showWebsite: boolTrue,
    showAddress: boolTrue,
    showContact: boolTrue,
    showInstagram: boolTrue,
    showFacebook: boolTrue,
    showLinkedIn: boolTrue,
    showTwitter: boolTrue,
    showSnapchat: boolTrue,
    showYouTube: boolTrue,
    showTelegram: boolTrue,
    showDiscord: boolTrue,
    showFax: boolTrue,
  },
  { _id: false }
);

// SOCIAL
const SocialSchema = new Schema(
  {
    organization: String,
    positionname: String,
    website: String,
    address: String,
    contact: String,
    social_instagram: String,
    social_facebook: String,
    social_linkedin: String,
    social_twitter: String,
    social_snapchat: String,
    social_youtube: String,
    social_telegram: String,
    social_discord: String,

    showPosition: boolTrue,
    showWebsite: boolTrue,
    showAddress: boolTrue,
    showContact: boolTrue,
    showInstagram: boolTrue,
    showFacebook: boolTrue,
    showLinkedIn: boolTrue,
    showTwitter: boolTrue,
    showSnapchat: boolTrue,
    showYouTube: boolTrue,
    showTelegram: boolTrue,
    showDiscord: boolTrue,
    showFax: boolTrue,
  },
  { _id: false }
);



// BUSINESS
const BusinessSchema = new Schema(
  {
    businessName: String,
    businessTagline: String,
    designation: String,
    website: String,
    mobile: String,
    contact: String,
    address: String,
    social_instagram: String,
    social_facebook: String,
    social_linkedin: String,
    social_twitter: String,
    social_snapchat: String,
    social_youtube: String,
    social_telegram: String,
    social_discord: String,

    showBusinessName: boolTrue,
    showBusinessTagline: boolTrue,
    showDesignation: boolTrue,
    showWebsite: boolTrue,
    showMobile: boolTrue,
    showContact: boolTrue,
    showAddress: boolTrue,
    showInstagram: boolTrue,
    showFacebook: boolTrue,
    showLinkedIn: boolTrue,
    showTwitter: boolTrue,
    showSnapchat: boolTrue,
    showYouTube: boolTrue,
    showTelegram: boolTrue,
    showDiscord: boolTrue,
    showFax: boolTrue,
  },
  { _id: false }
);

// POLITICAL
const PoliticalSchema = new Schema(
  {
    partyname: { type: String, required: true },
    positionname: String,
    mobile: String,
    contact: String,
    address: String,
    social_instagram: String,
    social_facebook: String,
    social_linkedin: String,
    social_twitter: String,
    social_snapchat: String,
    social_youtube: String,
    social_telegram: String,
    social_discord: String,

    showPosition: boolTrue,
    showMobile: boolTrue,
    showContact: boolTrue,
    showAddress: boolTrue,
    showInstagram: boolTrue,
    showFacebook: boolTrue,
    showLinkedIn: boolTrue,
    showTwitter: boolTrue,
    showSnapchat: boolTrue,
    showYouTube: boolTrue,
    showTelegram: boolTrue,
    showDiscord: boolTrue,
    showFax: boolTrue,
  },
  { _id: false }
);

// BRAND
const BrandSchema = new Schema(
  {
    brandName: { type: String },
    designation: String,
    website: String,
    address: String,
    contact: String,
    social_instagram: String,
    social_facebook: String,
    social_linkedin: String,
    social_twitter: String,
    social_snapchat: String,
    social_youtube: String,
    social_telegram: String,
    social_discord: String,

    showDesignation: boolTrue,
    showWebsite: boolTrue,
    showAddress: boolTrue,
    showContact: boolTrue,
    showInstagram: boolTrue,
    showFacebook: boolTrue,
    showLinkedIn: boolTrue,
    showTwitter: boolTrue,
    showSnapchat: boolTrue,
    showYouTube: boolTrue,
    showTelegram: boolTrue,
    showDiscord: boolTrue,
  },
  { _id: false }
);

/* -------------------------------------------------------------------------- */

const ProfileSchema = new Schema(
  {
    /* ----------------------------- OWNERSHIP ----------------------------- */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // top-level contact / identity fields (match frontend names)
    name: { type: String },
    mobile: { type: String },
    email: { type: String },
    businessName: { type: String },
    // image/file fields (cloudinary friendly)
    file: { type: String },
    cloudinary_id: { type: String },
    // birth date used by frontend components
    birthDate: { type: Date },
    address: { type: String },
    // Location fields added so frontend `city`, `state`, `country` persist
    city: { type: String },
    state: { type: String },
    country: { type: String },
	gender:{ type: String },
    religion: { type: String },
    fax: { type: String },

    // UI toggles / visibility defaults (global only)
    visibleName: { type: Boolean, default: true },
    showMobile: { type: Boolean, default: true },
    showFax: { type: Boolean, default: true },
    showProfileImage: { type: Boolean, default: true },

    // Note: per-profile-type show flags live inside each sub-schema
    

    /* --------------------------- PROFILE CONTROL -------------------------- */
    profileType: {
      type: String,
      enum: ["personal", "professional", "social", "business", "political", "brand"],
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* --------------------------- PROFILE DATA ----------------------------- */
    personal: { type: PersonalSchema, default: {} },
    professional: { type: ProfessionalSchema, default: {} },
    social: { type: SocialSchema, default: {} },
    business: { type: BusinessSchema, default: {} },
    political: { type: PoliticalSchema, default: undefined },
    brand: { type: BrandSchema, default: undefined },

    /* ---------------------- FIELD DISPLAY SETTINGS ---------------------- */
    // Array of field keys that user selected to display in image frame
    // Only used for non-political profiles
    selectedDisplayFields: { type: [String], default: [] },

  },
  { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/*         ENFORCE: ONLY ONE ACTIVE PROFILE PER USER (CRITICAL RULE)          */
/* -------------------------------------------------------------------------- */

ProfileSchema.pre("save", async function (next) {
  if (!this.isActive) return next();

  try {
    await this.constructor.updateMany(
      {
        userId: this.userId,
        _id: { $ne: this._id },
        isActive: true,
      },
      { $set: { isActive: false } }
    );
    next();
  } catch (err) {
    next(err);
  }
});

/* -------------------------------------------------------------------------- */
/*         DATABASE-LEVEL SAFETY (NO RACE CONDITIONS)                          */
/* -------------------------------------------------------------------------- */

ProfileSchema.index(
  { userId: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

export default mongoose.model("Profile", ProfileSchema);
