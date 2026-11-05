import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../url";
import socket from "../socket";
import { toast } from "react-toastify";
import { removeBackground } from "@imgly/background-removal";

import {
  User,
  Wand2,
  Trash2,
  Check,
  MapPin,
  ScanLine,
  ChevronDown,
  Calendar,
  RefreshCw,
  CheckCircle,
  Link,
} from "lucide-react";
import FieldSelectorModal from "./ProfileSections/FieldSelectorModal";
import SkeletonLoader from "./SkeletonLoader";
import Header from "../page/Header/Header";
import BottomNavbar from "../components/BottomNavbar";

// ─── Custom Checkbox ──────────────────────────────────────────────────────────
function CustomCheckbox({ checked, onChange, label, size = "md", colorScheme = { box: "bg-orange-500 border-orange-500", hover: "border-orange-400" } }) {
  const [isHovering, setIsHovering] = useState(false);

  const boxSize = size === "lg" ? "w-5 h-5 rounded-md" : "w-[18px] h-[18px] rounded-[5px]";

  const getHoverBorderColor = () => {
    if (colorScheme.hover.includes("blue")) return "#60a5fa";
    if (colorScheme.hover.includes("purple")) return "#c4b5fd";
    if (colorScheme.hover.includes("red")) return "#f87171";
    if (colorScheme.hover.includes("amber")) return "#fbbf24";
    if (colorScheme.hover.includes("pink")) return "#f9a8d4";
    if (colorScheme.hover.includes("green")) return "#86efac";
    return "#ff9c5b";
  };

  const boxClasses = checked
    ? colorScheme.box
    : "border-gray-300 bg-white";

  return (
    <label
      className="flex items-center gap-3.5 cursor-pointer w-fit group select-none"
      onClick={onChange}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className={`relative flex items-center justify-center shrink-0 border shadow-sm transition-all ${boxSize} ${boxClasses}`}
        style={!checked && isHovering ? { borderColor: getHoverBorderColor() } : {}}
      >
        {checked && (
          <Check
            className="text-white pointer-events-none"
            strokeWidth={3}
            size={size === "lg" ? 12 : 10}
          />
        )}
      </div>
      <span className="text-base text-gray-600 select-none group-hover:text-gray-900 transition-colors">
        {label}
      </span>
    </label>
  );
}

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({ label, value, onChange, options, placeholder, disabled = false }) {
  // React expects a scalar value for non-multiple select. 
  // If the backend returns an array (e.g., categories), use the first item or empty string.
  const safeValue = Array.isArray(value) ? (value[0] || "") : (value || "");

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2.5">{label}</label>
      )}
      <div className="relative group">
        <select
          value={safeValue}
          onChange={onChange}
          disabled={disabled}
          className={`w-full appearance-none border rounded-xl pl-4 pr-10 py-2.5 text-base transition-all shadow-sm ${disabled
            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-gray-50/50 border-gray-200 text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 focus:bg-white hover:bg-white cursor-pointer"
            }`}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
          <ChevronDown size={16} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

// ─── Text Input ───────────────────────────────────────────────────────────────
function TextInput({ label, type = "text", placeholder, value, onChange, readOnly, disabled = false, maxLength }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2.5">{label}</label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        readOnly={readOnly || disabled}
        className={`w-full border rounded-xl px-4 py-2.5 text-base shadow-sm transition-all
          ${readOnly || disabled
            ? "bg-gray-100/50 border-gray-200 text-gray-500 cursor-not-allowed focus:outline-none"
            : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 focus:bg-white hover:bg-white"
          }`}
      />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, iconBg, iconColor, title, titleColor = "text-gray-500" }) {
  return (
    <div className="bg-white border-b border-gray-100/80 px-4 py-3.5 md:px-7 md:py-5 flex items-center gap-2.5 md:gap-3">
      <div className={`w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon strokeWidth={1.5} className={`${iconColor} w-3.5 h-3.5 md:w-[18px] md:h-[18px]`} />
      </div>
      <h2 className={`!text-[11px] md:!text-xs font-bold tracking-widest ${titleColor} uppercase leading-none`}>{title}</h2>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserProfileSettings() {

  const navigate = useNavigate();

  const [saveState, setSaveState] = useState("idle");
  const [loading, setLoading] = useState(true);
  const simpleSocialRegex = /^[a-zA-Z0-9._@-]+$/;
  const allowedProfileImageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

  const [errorMessage, setErrorMessage] = useState("");
  const hasFetchedRef = useRef(false);

  // Avatar
  const [showInPreview, setShowInPreview] = useState(true);

  // Personal info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [showPhone, setShowPhone] = useState(true);
  const [nameVisible, setNameVisible] = useState(true);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [religion, setReligion] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Location (original)
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");



  // ✅ Profile Type (default valid backend type)
  const [profileType, setProfileType] = useState("professional");

  // ✅ Dynamic fields data from API
  const [profileTypes, setProfileTypes] = useState([]);
  const [profileTypesLoading, setProfileTypesLoading] = useState(false);

  // ✅ Dropdown data for specific profile types
  const [politicalPartyOptions, setPoliticalPartyOptions] = useState([]);
  const [professionalDropdownOptions, setProfessionalDropdownOptions] = useState([]);
  const [brandDropdownOptions, setBrandDropdownOptions] = useState([]);
  const [brandCategory, setBrandCategory] = useState("");
  const [selectedFields, setSelectedFields] = useState([]);
  const [isFieldSelectorOpen, setIsFieldSelectorOpen] = useState(false);

  // ✅ Field values
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");

  // ✅ Optional: show/hide (future use)
  const [showBio, setShowBio] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showBusinessName, setShowBusinessName] = useState(true);
  const [showDesignation, setShowDesignation] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showPosition, setShowPosition] = useState(true);
  const [showContact, setShowContact] = useState(true);

  // ✅ Debug
  // console.log("API profileTypes:", profileTypes);

  // ── PAGE 2 sections (added after Address) ──
  // Location 2
  const [city2, setCity2] = useState("");
  const [state2, setState2] = useState("");

  // ── Business Info ──
  const [businessName, setBusinessName] = useState("");
  const [designation, setDesignation] = useState("");
  const [businessTagline, setBusinessTagline] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");
  const [businessContact, setBusinessContact] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");


  // ── Political Info ──
  const [politicalPartyName, setPoliticalPartyName] = useState("");
  const [politicalPosition, setPoliticalPosition] = useState("");
  const [politicalContact, setPoliticalContact] = useState("");
  const [politicalAddress, setPoliticalAddress] = useState("");
  const [showPoliticalSocialLinks, setShowPoliticalSocialLinks] = useState(false);
  const [selectedPoliticalSocialLinks, setSelectedPoliticalSocialLinks] = useState([]);

  // ── Professional Info ──
  const [professionalCategories, setProfessionalCategories] = useState("");
  const [professionalDesignation, setProfessionalDesignation] = useState("");
  const [professionalWebsite, setProfessionalWebsite] = useState("");
  const [professionalAddress, setProfessionalAddress] = useState("");
  const [professionalContact, setProfessionalContact] = useState("");

  // ── Social Work Info ──
  const [socialWorkOrgName, setSocialWorkOrgName] = useState("");
  const [socialWorkPosition, setSocialWorkPosition] = useState("");
  const [socialWorkWebsite, setSocialWorkWebsite] = useState("");
  const [socialWorkAddress, setSocialWorkAddress] = useState("");
  const [socialWorkContact, setSocialWorkContact] = useState("");

  // ── Social Links ──
  const [instagramUrl, setInstagramUrl] = useState("");
  const [showInstagram, setShowInstagram] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [showLinkedin, setShowLinkedin] = useState(false);
  const [facebookUrl, setFacebookUrl] = useState("");
  const [showFacebook, setShowFacebook] = useState(false);
  const [twitterUrl, setTwitterUrl] = useState("");
  const [showTwitter, setShowTwitter] = useState(false);
  const [snapchatUrl, setSnapchatUrl] = useState("");
  const [showSnapchat, setShowSnapchat] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showYoutube, setShowYoutube] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState("");
  const [showTelegram, setShowTelegram] = useState(false);
  const [discordUrl, setDiscordUrl] = useState("");
  const [showDiscord, setShowDiscord] = useState(false);

  // ── Additional Fields ──
  const [fax, setFax] = useState("");
  const [showFax, setShowFax] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const canDeleteRemoteImage = !!preview;

  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const normalizeProfileFileUrl = (file) => {
    if (!file) return null;
    return file.startsWith("http")
      ? file
      : `${BASE_URL}/${file.replace(/^\/+/, "")}`;
  };

  const getUploadedProfileFileUrl = (responseData) => {
    const uploadedProfile = responseData?.profile || responseData || {};
    return normalizeProfileFileUrl(uploadedProfile.file);
  };

  const isAllowedProfileImage = (file) => {
    if (!file) return false;
    const ext = file.name?.split(".").pop()?.toLowerCase();
    const allowedExt = new Set(["jpg", "jpeg", "png", "webp"]);
    return allowedProfileImageTypes.has(file.type) && allowedExt.has(ext);
  };

  const fetchProfile = async () => {
    // ✅ Ensure token exists before making request
    // const token = window.localStorage.getItem("authToken");

    // if (!token) {
    //   setErrorMessage("Please login first to view your profile settings.");
    //   setLoading(false);
    //   return;
    // }

    try {
      setErrorMessage("");
      const res = await axios.get(`${BASE_URL}/api/profiles/me`, { withCredentials: true });

      const data = res.data?.profile || res.data || {};

      // 🔥 ADD THIS
      const fileUrl = normalizeProfileFileUrl(data.file);
      setPreview(fileUrl);

      setFullName(data.name || "");
      setEmail(data.email || "");
      const rawMobile = data.mobile || "";
      const formattedMobile = (rawMobile.length === 12 && rawMobile.startsWith("91"))
        ? rawMobile.slice(2)
        : rawMobile;
      setPhone(formattedMobile);
      setCity(data.city || "");
      setStateName(data.state || "");
      setGender(data.gender || "");
      setReligion(data.religion || "");
      setBirthDate(data.birthDate || "");
      let fetchedProfileType = data.profiletype || data.profileType || "professional";
      if (fetchedProfileType === "social") fetchedProfileType = "social_work";
      setProfileType(fetchedProfileType);
      setBio(data.bio || "");
      setShowBio(data.showBio ?? true);
      setWebsite(data.website || "");
      setShowWebsite(data.showWebsite ?? true);
      setAddress(data.address || "");

      setBusinessName(data.businessName || data.brandName || "");
      setDesignation(data.designation || "");
      setBusinessTagline(data.businessTagline || "");
      setBusinessWebsite(data.website || data.businessWebsite || "");
      setBusinessContact(data.contact || data.businessContact || "");
      setBusinessAddress(data.address || data.businessAddress || "");
      setBrandCategory(data.brandCategory || data.brandName || "");

      setPoliticalPartyName(data.partyname || data.politicalPartyName || "");
      setPoliticalPosition(data.positionname || data.politicalPosition || "");
      setPoliticalContact(data.contact || data.politicalContact || "");
      setPoliticalAddress(data.address || data.politicalAddress || "");
      setShowPoliticalSocialLinks(data.showPoliticalSocialLinks ?? false);
      setSelectedPoliticalSocialLinks(Array.isArray(data.selectedPoliticalSocialLinks) ? data.selectedPoliticalSocialLinks : []);

      setProfessionalCategories(data.categories || data.professionalCategories || "");
      setProfessionalDesignation(data.designation || data.professionalDesignation || "");
      setProfessionalWebsite(data.website || data.professionalWebsite || "");
      setProfessionalAddress(data.address || data.professionalAddress || "");
      setProfessionalContact(data.contact || data.professionalContact || "");

      setSocialWorkOrgName(data.organization || data.socialWorkOrgName || "");
      setSocialWorkPosition(data.positionname || data.socialWorkPosition || data.designation || "");
      setSocialWorkWebsite(data.website || data.socialWorkWebsite || "");
      setSocialWorkAddress(data.address || data.socialWorkAddress || "");
      setSocialWorkContact(data.contact || data.socialWorkContact || "");

      setInstagramUrl(data.instagramUrl || data.social_instagram || "");
      setShowInstagram(data.showInstagram ?? true);
      setLinkedinUrl(data.linkedinUrl || data.social_linkedin || "");
      setShowLinkedin(data.showLinkedIn ?? data.showLinkedin ?? true);
      setFacebookUrl(data.facebookUrl || data.social_facebook || "");
      setShowFacebook(data.showFacebook ?? true);
      setTwitterUrl(data.twitterUrl || data.social_twitter || "");
      setShowTwitter(data.showTwitter ?? true);
      setSnapchatUrl(data.snapchatUrl || data.social_snapchat || "");
      setShowSnapchat(data.showSnapchat ?? true);
      setYoutubeUrl(data.youtubeUrl || data.social_youtube || "");
      setShowYoutube(data.showYouTube ?? data.showYoutube ?? true);
      setTelegramUrl(data.telegramUrl || data.social_telegram || "");
      setShowTelegram(data.showTelegram ?? true);
      setDiscordUrl(data.discordUrl || data.social_discord || "");
      setShowDiscord(data.showDiscord ?? true);
      setFax(data.fax || "");
      setShowFax(data.showFax ?? true);
      setShowPhone(data.showPhone ?? true);
      setNameVisible(data.visibleName ?? data.nameVisible ?? true);
      setShowInPreview(data.showProfileImage ?? data.showInPreview ?? true);
      setShowBusinessName(data.showBusinessName ?? true);
      setShowDesignation(data.showDesignation ?? true);
      setShowCategories(data.showCategories ?? true);
      setShowPosition(data.showPosition ?? true);
      setShowContact(data.showContact ?? true);
      const storedFields =
        data.selectedFields ??
        data.visibleFields ??
        data.profileFields ??
        data.fields ??
        [];
      setSelectedFields(Array.isArray(storedFields) ? storedFields : []);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setErrorMessage(
        err.response?.data?.message || "Unable to load profile settings right now."
      );
      toast.error(err.response?.data?.message || "Unable to load profile settings right now.");
    } finally {
      setLoading(false);
    }
  };

  const normalizeDropdownItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) {
      return items
        .map((item) => {
          if (item === null || item === undefined) return null;
          if (typeof item === "string" || typeof item === "number") {
            const text = String(item);
            return { value: text, label: text };
          }
          const value = item.value ?? item.code ?? item.id ?? item.name ?? item.key ?? "";
          const label = item.label ?? item.name ?? item.title ?? item.value ?? "";
          if (!value) return null;
          return { value: String(value), label: String(label || value) };
        })
        .filter(Boolean);
    }
    if (typeof items === "object") {
      return Object.values(items)
        .map((item) => {
          if (item === null || item === undefined) return null;
          if (typeof item === "string" || typeof item === "number") {
            const text = String(item);
            return { value: text, label: text };
          }
          const value = item.value ?? item.code ?? item.id ?? item.name ?? item.key ?? "";
          const label = item.label ?? item.name ?? item.title ?? item.value ?? "";
          if (!value) return null;
          return { value: String(value), label: String(label || value) };
        })
        .filter(Boolean);
    }
    return [];
  };

  const fetchDropdownOptions = async (type, setter) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/profile-types/${type}`, { withCredentials: true });
      const payload = res.data?.types ?? res.data?.data ?? res.data ?? [];
      const parsed = normalizeDropdownItems(payload);
      if (parsed.length) {
        setter(parsed);
      }
    } catch (err) {
      console.error(`Profile dropdown (${type}) error:`, err);
    }
  };



  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchProfile();
  }, []);

  useEffect(() => {
    fetchDropdownOptions("political", setPoliticalPartyOptions);
    fetchDropdownOptions("professional", setProfessionalDropdownOptions);
    fetchDropdownOptions("brand", setBrandDropdownOptions);
  }, []);

  // 🔥 profileType change hone pe API call hogi
  useEffect(() => {
    fetchProfileTypes();
  }, [profileType]);

  // ✅ UPDATED FUNCTION
  const fetchProfileTypes = async () => {
    try {
      setProfileTypesLoading(true);

      const res = await axios.get(`${BASE_URL}/api/profile-types/${profileType}`, { withCredentials: true });

      const data = res.data?.types || res.data || [];
      setProfileTypes(data);

      // 🔥 SHOW / HIDE LOGIC


    } catch (err) {
      console.error("Profile types error:", err);
    } finally {
      setProfileTypesLoading(false);
    }
  };

  const getFrameCategoriesForProfileType = () => {
    const asArray = (value) => {
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (item === null || item === undefined) return "";
            if (typeof item === "string" || typeof item === "number") return String(item).trim();
            return String(item?.name || item?.value || item?.label || "").trim();
          })
          .filter(Boolean);
      }

      if (typeof value === "string") {
        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      if (value === null || value === undefined) return [];

      const normalized = String(value).trim();
      return normalized ? [normalized] : [];
    };

    const categoryMap = {
      professional: professionalCategories,
      brand: brandCategory,
      business: null, // FIX: Business Name should not act as a frame category
      social_work: socialWorkOrgName,
      political: politicalPartyName,
    };

    return asArray(categoryMap[profileType]);
  };

  const handleProfileTypeChange = (newType) => {
    setProfileType(newType);
    setErrorMessage("");
    setIsFieldSelectorOpen(false);

    // Match MyProfile behavior: political profile saves without field-selector popup.
    if (newType === "political") {
      setSelectedFields([]);
    }
  };

  const normalizeSelectedFields = (fields = []) => {
    const normalized = fields.map((field) => {
      const lowered = String(field || "").toLowerCase();
      if (lowered === "contact" || lowered === "mobile") return "mobile";
      return lowered;
    });

    return [...new Set(normalized)];
  };

  const fieldLabelMap = {
    name: "Name",
    businessname: "Business Name",
    designation: "Designation",
    website: "Website",
    bio: "Bio",
    organization: "Organization / Party Name",
    email: "Email",
    mobile: "Contact",
    fax: "Fax",
    social_instagram: "Instagram",
    social_facebook: "Facebook",
    social_linkedin: "LinkedIn",
    social_twitter: "Twitter",
    social_snapchat: "Snapchat",
    social_youtube: "YouTube",
    social_telegram: "Telegram",
    social_discord: "Discord",
  };

  const getSelectedFieldValue = (fieldKey) => {
    const key = String(fieldKey || "").toLowerCase();

    if (key === "name") return fullName;
    if (key === "businessname") return businessName;
    if (key === "designation") {
      if (profileType === "professional") return professionalDesignation;
      if (profileType === "political") return politicalPosition;
      if (profileType === "social_work") return socialWorkPosition;
      return designation;
    }
    if (key === "bio") return bio;
    if (key === "email") return email;
    if (key === "fax") return fax;
    if (key === "mobile") return phone;
    if (key === "contact") {
      if (profileType === "professional") return professionalContact;
      if (profileType === "business" || profileType === "brand") return businessContact;
      if (profileType === "political") return politicalContact;
      if (profileType === "social_work") return socialWorkContact;
      return phone;
    }
    if (key === "organization") {
      if (profileType === "political") return politicalPartyName;
      if (profileType === "social_work") return "";
      return "";
    }
    if (key === "website") {
      if (profileType === "professional") return professionalWebsite;
      if (profileType === "business" || profileType === "brand") return businessWebsite;
      if (profileType === "political") return "";
      if (profileType === "social_work") return socialWorkWebsite;
      return website;
    }

    const socialFieldMap = {
      social_instagram: instagramUrl,
      social_facebook: facebookUrl,
      social_linkedin: linkedinUrl,
      social_twitter: twitterUrl,
      social_snapchat: snapchatUrl,
      social_youtube: youtubeUrl,
      social_telegram: telegramUrl,
      social_discord: discordUrl,
    };

    return socialFieldMap[key] || "";
  };

  const isFieldFilled = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const getProfileTypeValidationMessage = () => {
    if (!profileType) return "Please select a profile type";
    if (profileType === "political" && !String(politicalPartyName || "").trim()) {
      return "Political party / organization name is required";
    }
    if (profileType === "professional" && !String(professionalCategories || "").trim()) {
      return "Professional category is required";
    }
    if (profileType === "brand" && !String(businessName || "").trim()) {
      return "Brand name is required";
    }
    return "";
  };


  const handleSave = async (fieldSelections = null) => {

    if (saveState !== "idle") return;


    if (instagramUrl && !simpleSocialRegex.test(instagramUrl)) {
      setErrorMessage("Instagram username invalid (only letters, numbers, ., _, - allowed)");
      toast.error("Instagram username invalid (only letters, numbers, ., _, - allowed)");
      return;
    }

    if (linkedinUrl && !simpleSocialRegex.test(linkedinUrl)) {
      setErrorMessage("LinkedIn username invalid");
      toast.error("LinkedIn username invalid");
      return;
    }

    if (facebookUrl && !simpleSocialRegex.test(facebookUrl)) {
      setErrorMessage("Facebook username invalid");
      toast.error("Facebook username invalid");
      return;
    }

    if (twitterUrl && !simpleSocialRegex.test(twitterUrl)) {
      setErrorMessage("Twitter username invalid");
      toast.error("Twitter username invalid");
      return;
    }

    if (snapchatUrl && !simpleSocialRegex.test(snapchatUrl)) {
      setErrorMessage("Snapchat username invalid");
      toast.error("Snapchat username invalid");
      return;
    }

    if (youtubeUrl && !simpleSocialRegex.test(youtubeUrl)) {
      setErrorMessage("YouTube URL invalid");
      toast.error("YouTube URL invalid");
      return;
    }

    if (telegramUrl && !simpleSocialRegex.test(telegramUrl)) {
      setErrorMessage("Telegram username invalid");
      toast.error("Telegram username invalid");
      return;
    }

    if (discordUrl && !simpleSocialRegex.test(discordUrl)) {
      setErrorMessage("Discord username invalid");
      toast.error("Discord username invalid");
      return;
    }

    // 2. then API call 👇


    // ✅ Ensure token exists before saving
    // const token = window.localStorage.getItem("authToken");
    // if (!token) {
    //   setErrorMessage("Please login first to save profile settings.");
    //   return;
    // }

    if (!fullName.trim()) {
      setErrorMessage("Name is required");
      toast.error("Name is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setErrorMessage("Invalid email format");
      toast.error("Invalid email format");
      return;
    }




    if (!phone.trim()) {
      setErrorMessage("Phone number is required");
      toast.error("Phone number is required");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setErrorMessage("Phone must be 10 digits");
      toast.error("Phone must be 10 digits");
      return;
    }

    const profileTypeValidationMessage = getProfileTypeValidationMessage();
    if (profileTypeValidationMessage) {
      setErrorMessage(profileTypeValidationMessage);
      toast.error(profileTypeValidationMessage);
      return;
    }

    setSaveState("saving");



    const fieldsToSave = Array.isArray(fieldSelections) ? fieldSelections : selectedFields;
    const frameCategories = getFrameCategoriesForProfileType();
    const framePartyName = String(politicalPartyName || "").trim();

    try {
      setErrorMessage("");

      // ✅ STEP 1: upload file if exists
      let uploadedFileUrl = null;

      // if (selectedFile) {
      //   uploadedFileUrl = await uploadSelectedFile();
      // }

      // ✅ STEP 2: send ALL data including file
      const normalizedProfileType = profileType === "social" ? "social_work" : profileType;
      const apiProfileType = normalizedProfileType === "social_work" ? "social" : normalizedProfileType;
      const resolvedDesignation =
        normalizedProfileType === "professional"
          ? professionalDesignation
          : normalizedProfileType === "political"
            ? politicalPosition
            : normalizedProfileType === "social_work"
              ? socialWorkPosition
              : designation;
      const resolvedWebsite =
        normalizedProfileType === "professional"
          ? professionalWebsite
          : normalizedProfileType === "business" || normalizedProfileType === "brand"
            ? businessWebsite
            : normalizedProfileType === "social_work"
              ? socialWorkWebsite
              : normalizedProfileType === "political"
                ? ""
                : website;
      const resolvedAddress =
        normalizedProfileType === "professional"
          ? professionalAddress
          : normalizedProfileType === "business" || normalizedProfileType === "brand"
            ? businessAddress
            : normalizedProfileType === "social_work"
              ? socialWorkAddress
              : normalizedProfileType === "political"
                ? politicalAddress
                : address;
      const payload = {
        name: fullName,
        email,
        mobile: phone,
        city,
        state: stateName,
        gender,
        religion,
        birthDate,
        profileType: apiProfileType,
        profiletype: apiProfileType,
        bio,
        website: resolvedWebsite,
        address: resolvedAddress,
        fax,

        // Business fields
        businessName,
        designation: resolvedDesignation,
        businessTagline,
        categories: professionalCategories,
        brandName: brandCategory || businessName,

        // Political/Social fields
        partyname: politicalPartyName,
        positionname:
          normalizedProfileType === "political"
            ? politicalPosition
            : normalizedProfileType === "social_work"
              ? socialWorkPosition
              : "",
        organization: normalizedProfileType === "social_work" ? "" : (socialWorkOrgName || politicalPartyName),
        contact: phone,
        showPoliticalSocialLinks,
        selectedPoliticalSocialLinks: Array.isArray(selectedPoliticalSocialLinks) ? selectedPoliticalSocialLinks : [],

        // Social work fields
        socialWorkWebsite,
        socialWorkAddress,
        socialWorkContact,

        // Social Links
        social_instagram: instagramUrl,
        social_linkedin: linkedinUrl,
        social_facebook: facebookUrl,
        social_twitter: twitterUrl,
        social_snapchat: snapchatUrl,
        social_youtube: youtubeUrl,
        social_telegram: telegramUrl,
        social_discord: discordUrl,

        // Visibility toggles
        visibleName: nameVisible,
        showMobile: showPhone,
        showFax,
        showProfileImage: showInPreview,
        showBusinessName,
        showDesignation,
        showCategories,
        showPosition,
        showInstagram,
        showFacebook,
        showLinkedIn: showLinkedin,
        showTwitter,
        showSnapchat,
        showYouTube: showYoutube,
        showTelegram,
        showDiscord,
        showBio,
        showWebsite,
        showAddress,
        showContact: showPhone,

        // Selected display fields
        selectedDisplayFields: Array.isArray(fieldsToSave) ? fieldsToSave : [],
      };

      // Add file if exists
      const formData = new FormData();


      Object.entries(payload).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value ?? "");
        }
      });


      if (selectedFile) {
        if (!isAllowedProfileImage(selectedFile)) {
          throw new Error("Please select a valid image file.");
        }
        formData.append("file", selectedFile);
      }


      const response = await axios.put(
        `${BASE_URL}/api/profiles/me`,
        formData,
        {
          withCredentials: true,
        }
      );

      console.debug("Profile save response:", response.data);

      const savedFileUrl = getUploadedProfileFileUrl(response.data);
      if (savedFileUrl) {
        setPreview(savedFileUrl);
        setSelectedFile(null);
      }

      // Send frame-relevant metadata so ImageView can immediately switch to the new frame set.
      socket.emit("profileTypeUpdated", {
        profileType,
        categories: frameCategories,
        partyName: framePartyName,
      });

      if (Array.isArray(fieldsToSave)) {
        setSelectedFields(fieldsToSave);
      }

      // 🔥 Save selectedDisplayFields to localStorage for hi.jsx to use
      if (Array.isArray(fieldsToSave)) {
        localStorage.setItem("selectedDisplayFields", JSON.stringify(fieldsToSave));
      }

      setSaveState("saved");

      setTimeout(() => {
        // 🔥 Navigate to home after successful save
        navigate("/home");
      }, 1000);
      setTimeout(() => setSaveState("idle"), 2000);

    } catch (err) {
      console.error("Update error:", err);
      setErrorMessage(
        err.response?.data?.message || "Unable to save profile settings right now."
      );
      toast.error(err.response?.data?.message || "Unable to save profile settings right now.");
      setSaveState("idle");
    }
  };

  const openFieldSelector = () => {
    if (saveState !== "idle") return;

    const profileTypeValidationMessage = getProfileTypeValidationMessage();
    if (profileTypeValidationMessage) {
      setErrorMessage(profileTypeValidationMessage);
      toast.error(profileTypeValidationMessage);
      return;
    }

    if (profileType === "political") {
      handleSave([]);
      return;
    }

    setErrorMessage("");

    // --- AUTO-TICK LOGIC ---
    // 1. Keep previously selected fields that are STILL filled
    let suggested = selectedFields.filter(key => isFieldFilled(getSelectedFieldValue(key)));

    // 2. Find all currently filled fields
    const allFilled = Object.keys(fieldLabelMap).filter(key => isFieldFilled(getSelectedFieldValue(key)));

    // 3. Append newly filled fields to the suggestions list
    allFilled.forEach(key => {
      if (!suggested.includes(key)) {
        suggested.push(key);
      }
    });

    setSelectedFields(suggested);
    // -----------------------

    setIsFieldSelectorOpen(true);
  };

  const handleFieldSelectorClose = () => {
    setIsFieldSelectorOpen(false);
  };

  const handleFieldSelectorConfirm = (fields) => {
    const normalizedFields = normalizeSelectedFields(fields);
    const missingFields = normalizedFields.filter(
      (fieldKey) => !isFieldFilled(getSelectedFieldValue(fieldKey))
    );

    if (missingFields.length > 0) {
      const prettyFields = missingFields
        .map((fieldKey) => fieldLabelMap[fieldKey] || fieldKey)
        .join(", ");
      setErrorMessage(`Please fill selected fields first: ${prettyFields}`);
      toast.error(`Please fill selected fields first: ${prettyFields}`);
      return;
    }

    setErrorMessage("");
    setIsFieldSelectorOpen(false);
    handleSave(normalizedFields);
  };

  const uploadFileToBackend = async (file) => {
    if (!file) throw new Error("Please select a file to upload.");
    if (!isAllowedProfileImage(file)) {
      throw new Error("Please select a valid image file.");
    }

    const normalizedProfileType = profileType === "social" ? "social_work" : profileType;
    const apiProfileType = normalizedProfileType === "social_work" ? "social" : normalizedProfileType;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("profileType", apiProfileType);
    formData.append("name", fullName);
    formData.append("email", email);
    formData.append("mobile", phone);

    if (apiProfileType === "political") {
      formData.append("partyname", politicalPartyName);
    }

    if (apiProfileType === "social") {
      formData.append("organization", socialWorkOrgName);
    }

    const response = await axios.put(`${BASE_URL}/api/profiles/me`, formData, {
      withCredentials: true,
    });

    const fileUrl = getUploadedProfileFileUrl(response.data);
    if (!fileUrl) throw new Error("Upload succeeded but the server returned no file URL.");

    return fileUrl;
  };

  const handleImageUploadAndProcess = async (file) => {
    if (!file) return;

    if (!isAllowedProfileImage(file)) {
      toast.error("Please select a valid image file.");
      return;
    }

    // Show local preview of the selected image immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setSelectedFile(file);

    try {
      setIsImageProcessing(true);
      setSaveState("saving");

      // Show toast "please wait, background is being removed"
      toast.info("please wait, background is being removed");

      // Automatically remove background using IMGly
      const bgRemovedBlob = await removeBackground(file);
      const bgRemovedFile = new File([bgRemovedBlob], "bg-removed.png", {
        type: "image/png",
      });

      // Upload only final image to ImageKit and save in DB via backend
      const bgRemovedUrl = await uploadFileToBackend(bgRemovedFile);
      setPreview(bgRemovedUrl);
      setSelectedFile(null); // Clear selected file state as it's fully uploaded

      toast.success("Background removed and saved!");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Image processing/upload failed:", err);
      toast.error(err.message || "Failed to process image");
      setSaveState("idle");
    } finally {
      setIsImageProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);


  const extractFileIdentifier = (fileUrl) => {
    if (!fileUrl) return "";

    if (fileUrl.startsWith("blob:")) {
      return "";
    }

    try {
      const parsed = new URL(fileUrl);
      return parsed.pathname.replace(/^\//, "");
    } catch {
      return fileUrl;
    }
  };

  const handleDeleteImage = async () => {
    try {
      if (!preview) {
        toast.warn("No image to delete");
        return;
      }

      const fileIdentifier = extractFileIdentifier(preview);

      if (!fileIdentifier) {
        toast.warn("Save or upload the image first before trying to delete it.");
        return;
      }

      setErrorMessage("");
      setIsDeletingImage(true);

      await axios.put(`${BASE_URL}/api/profiles/remove-image`, {}, {
        withCredentials: true,
      });

      setPreview(null);
      setSelectedFile(null);

      toast.success("Image deleted");

    } catch (err) {
      console.error("Delete image error", err);
      setErrorMessage(err.response?.data?.message || "Failed to delete image");
      toast.error(err.response?.data?.message || "Failed to delete image");
    } finally {
      setIsDeletingImage(false);
    }
  };

  const profileTypeOptions = [
    { value: "personal", label: "Personal" },
    { value: "professional", label: "Professional" },
    { value: "social_work", label: "Social Work" },
    { value: "business", label: "Business" },
    { value: "political", label: "Political" },
    { value: "brand", label: "Brand" },
  ];



  // ✅ COLOR SCHEME BASED ON PROFILE TYPE
  const getButtonColorClasses = () => {
    const colorMap = {
      personal: {
        primary: "from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 border-blue-600/50 shadow-blue-500/20 hover:shadow-blue-500/40 focus:ring-blue-500/20",
        success: "from-emerald-500 to-emerald-600 border-emerald-600/50 shadow-emerald-500/20",
        saving: "from-blue-500 to-blue-600 opacity-80",
        icon: "text-blue-500",
        iconRing: "focus:ring-blue-200/50",
      },
      professional: {
        primary: "from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 border-purple-600/50 shadow-purple-500/20 hover:shadow-purple-500/40 focus:ring-purple-500/20",
        success: "from-emerald-500 to-emerald-600 border-emerald-600/50 shadow-emerald-500/20",
        saving: "from-purple-500 to-purple-600 opacity-80",
        icon: "text-purple-500",
        iconRing: "focus:ring-purple-200/50",
      },
      business: {
        primary: "from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 border-red-600/50 shadow-red-500/20 hover:shadow-red-500/40 focus:ring-red-500/20",
        success: "from-emerald-500 to-emerald-600 border-emerald-600/50 shadow-emerald-500/20",
        saving: "from-red-500 to-red-600 opacity-80",
        icon: "text-red-500",
        iconRing: "focus:ring-red-200/50",
      },
      political: {
        primary: "from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-amber-600/50 shadow-amber-500/20 hover:shadow-amber-500/40 focus:ring-amber-500/20",
        success: "from-emerald-500 to-emerald-600 border-emerald-600/50 shadow-emerald-500/20",
        saving: "from-amber-500 to-amber-600 opacity-80",
        icon: "text-amber-500",
        iconRing: "focus:ring-amber-200/50",
      },
      brand: {
        primary: "from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 border-pink-600/50 shadow-pink-500/20 hover:shadow-pink-500/40 focus:ring-pink-500/20",
        success: "from-emerald-500 to-emerald-600 border-emerald-600/50 shadow-emerald-500/20",
        saving: "from-pink-500 to-pink-600 opacity-80",
        icon: "text-pink-500",
        iconRing: "focus:ring-pink-200/50",
      },
      social_work: {
        primary: "from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 border-green-600/50 shadow-green-500/20 hover:shadow-green-500/40 focus:ring-green-500/20",
        success: "from-emerald-500 to-emerald-600 border-emerald-600/50 shadow-emerald-500/20",
        saving: "from-green-500 to-green-600 opacity-80",
        icon: "text-green-500",
        iconRing: "focus:ring-green-200/50",
      },
    };

    return colorMap[profileType] || colorMap.professional;
  };

  const buttonColors = getButtonColorClasses();

  // ✅ CHECKBOX COLOR SCHEME BASED ON PROFILE TYPE
  const getCheckboxColorScheme = () => {
    const colorMap = {
      personal: { box: "bg-blue-500 border-blue-500", hover: "border-blue-400" },
      professional: { box: "bg-purple-500 border-purple-500", hover: "border-purple-400" },
      business: { box: "bg-red-500 border-red-500", hover: "border-red-400" },
      political: { box: "bg-amber-500 border-amber-500", hover: "border-amber-400" },
      brand: { box: "bg-pink-500 border-pink-500", hover: "border-pink-400" },
      social_work: { box: "bg-green-500 border-green-500", hover: "border-green-400" },
    };

    return colorMap[profileType] || colorMap.professional;
  };

  const checkboxColors = getCheckboxColorScheme();

  if (loading) {
    return <SkeletonLoader />;
  }

  return (


    <div
      className="bg-[#FAFAFA] text-gray-900 min-h-screen pb-12 antialiased relative overflow-x-hidden selection:bg-orange-500/20 selection:text-orange-900"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Header />
      <div className="h-20 md:h-24 w-full shrink-0"></div>
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="w-[800px] h-[400px] bg-gradient-to-r from-orange-400/10 to-pink-500/10 blur-[100px] rounded-full opacity-60 -top-32 absolute" />
      </div>

      <main className="max-w-[1300px] mx-auto">
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {/* ── Header ── */}
        <header className="flex flex-row justify-between  items-center mb-10 gap-5 mx-4 lg:mx-0 my-3 lg:my-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">My Profile</h1>
            <p className="text-base text-gray-500 mt-2 hidden sm:block">
              Update your profile information and manage your visibility settings
            </p>
          </div>

          {/* Save Button — small on all screens */}
          <button
            onClick={openFieldSelector}
            disabled={saveState !== "idle"}
            className={`inline-flex items-center cursor-pointer justify-center gap-1.5 text-white px-4 py-2 rounded-xl font-medium text-sm border shadow-sm transition-all duration-200 focus:ring-2 outline-none flex-shrink-0 whitespace-nowrap
              ${saveState === "saved"
                ? "bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-600/50 shadow-emerald-500/20 cursor-not-allowed"
                : saveState === "saving"
                  ? "bg-gradient-to-b " + buttonColors.saving + " cursor-not-allowed"
                  : "bg-gradient-to-b " + buttonColors.primary
              }`}
          >
            {saveState === "saving" && <RefreshCw size={13} className="animate-spin" />}
            {saveState === "saved" && <CheckCircle size={13} strokeWidth={2} />}
            {saveState === "saving" ? "Saving..."
              : saveState === "saved" ? "Changes Saved"
                : "Save Profile"}
          </button>
        </header>

        <div className="flex flex-col px-6 lg:flex-row justify-between items-start w-full gap-6">

          {/* LEFT */}
          <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col  gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/80 p-7 shadow-sm flex flex-col items-center">

              <label className="w-48 h-48 border-[1.5px] border-dashed border-gray-300 rounded-3xl flex items-center justify-center bg-gray-50/50 mb-6 relative group cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all duration-300 shadow-sm hover:shadow-md">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    handleImageUploadAndProcess(file);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    onError={() => {
                      // console.warn("Profile preview image failed to load:", preview);
                      if (preview && !preview.startsWith("blob:")) {
                        setPreview(null);
                      }
                    }}
                    className="w-full h-full object-cover rounded-3xl"
                  />
                ) : (
                  <User
                    size={64}
                    strokeWidth={1}
                    className="text-gray-300 group-hover:text-orange-400 transition-colors"
                  />
                )}

                <div className="absolute inset-0 rounded-3xl ring-4 ring-orange-500/0 group-hover:ring-orange-500/10 transition-all duration-300" />
              </label>
              <div className="text-center mb-7 w-full px-2">
                <p className="text-xs font-medium text-gray-500 truncate mb-1">
                  {selectedFile?.name || (preview ? "Current profile image" : "No file selected")}
                </p>
                {/* <p className="text-xs text-gray-400 truncate">
                  id: profiles/1774856030992-user-interface
                </p> */}
              </div>

              <div className="w-full flex flex-col gap-3.5 mb-7">
                <button
                  onClick={handleDeleteImage}
                  disabled={isDeletingImage || !canDeleteRemoteImage}
                  className={`w-full cursor-pointer inline-flex items-center justify-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-medium text-base transition-all duration-200 shadow-sm outline-none focus:ring-4 ${isDeletingImage
                    ? "opacity-70 cursor-not-allowed text-gray-400 border-gray-200 hover:bg-white"
                    : `hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-700 ${buttonColors.iconRing}`
                    }`}
                >
                  <Trash2 size={18} strokeWidth={1.5} />
                  {isDeletingImage ? "Deleting..." : "Delete Image"}
                </button>
                <button
                  onClick={() => handleImageUploadAndProcess(selectedFile)}
                  disabled={isImageProcessing || isDeletingImage || !selectedFile}
                  className={`w-full cursor-pointer inline-flex items-center justify-center gap-2 bg-gradient-to-b ${buttonColors.primary} text-white px-4 py-2.5 rounded-xl font-medium text-base transition-all duration-200 shadow-sm outline-none focus:ring-4`}
                >
                  {isImageProcessing ? "Uploading..." : "Upload Image"}
                </button>
              </div>

              <CustomCheckbox
                checked={showInPreview}
                onChange={() => setShowInPreview((v) => !v)}
                label="Show in Preview"
                size="lg"
                colorScheme={checkboxColors}
              />
            </div>
          </aside>

          {/* CENTER */}
          <section className="w-full lg:w-[600px] flex-shrink-0 min-h-[160px] md:min-h-[175px] bg-white/80 rounded-2xl border border-gray-200/80 shadow-sm mb-6 lg:mb-0">
            <SectionHeader
              icon={User}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              title="Personal Information"
            />
            <div className="p-7 flex flex-col gap-6">

              <TextInput
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={50}
                disabled={!nameVisible}
              />

              <div className="flex flex-col gap-4">
                <CustomCheckbox
                  checked={showPhone}
                  onChange={() => setShowPhone((v) => !v)}
                  label="Show phone in preview"
                  colorScheme={checkboxColors}
                />
                <CustomCheckbox
                  checked={nameVisible}
                  onChange={() => setNameVisible((v) => !v)}
                  label="Make name visible"
                  colorScheme={checkboxColors}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <TextInput
                  label="Email"
                  type="email"
                  placeholder="Enter Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={100}
                />
                <TextInput
                  label="Phone"
                  type="tel"
                  placeholder="Contact number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                />
              </div>

              <div className="w-full rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
                <div className="flex flex-col gap-3">
                  <TextInput
                    label="Fax"
                    placeholder="Your fax number"
                    value={fax}
                    onChange={(e) => setFax(e.target.value)}
                    maxLength={15}
                  />
                  <CustomCheckbox
                    checked={showFax}
                    onChange={() => setShowFax((v) => !v)}
                    label="Show Fax"
                    colorScheme={checkboxColors}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <CustomSelect
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="Select Gender"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "non-binary", label: "Non-binary" },
                    { value: "other", label: "Other" },
                    { value: "prefer-not", label: "Prefer not to say" },
                  ]}
                />
                <CustomSelect
                  label="Religion"
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  placeholder="Select Religion"
                  options={[
                    { value: "christianity", label: "Christianity" },
                    { value: "islam", label: "Islam" },
                    { value: "hinduism", label: "Hinduism" },
                    { value: "buddhism", label: "Buddhism" },
                    { value: "other", label: "Other" },
                    { value: "none", label: "Prefer not to say" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2.5">Birth Date</label>
                <div className="relative group">
                  <input
                    type="date"
                    value={birthDate ? birthDate.split("T")[0] : ""}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 focus:bg-white hover:bg-white transition-all shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                    <Calendar size={18} strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* RIGHT */}
          <div className=" w-full lg:w-[300px] flex-shrink-0">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/80 p-7 shadow-sm flex flex-col gap-6 min-h-[450px]">

              <SectionHeader
                icon={MapPin}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-500"
                title="Location"
              />

              {/* COLUMN layout */}
              <div className="flex flex-col gap-6">
                <TextInput
                  label="City"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={50}
                />
                <TextInput
                  label="State"
                  placeholder="State"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  maxLength={50}
                />
              </div>

            </div>
          </div>
        </div>



        {/* ── Main Grid ── */}

      </main>
      <div className="flex flex-col w-full box-border px-6 lg:flex-row lg:items-start gap-6 mt-8  lg:px-20">
        <section className="bg-white/80 h-fit backdrop-blur-xl border border-gray-200/80 w-full lg:w-300 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">

          <SectionHeader
            icon={ScanLine}
            iconBg="bg-pink-50"
            iconColor="text-pink-500"
            title="Profile Type"
          />
          <div className="p-7 flex flex-col gap-6">

            <CustomSelect
              label="Select Profile Type"
              value={profileType}
              onChange={(e) => handleProfileTypeChange(e.target.value)}
              options={profileTypeOptions}  // ✅ FIXED
            />

            {profileType === 'business' ? (
              <>
                <TextInput
                  label="Business Name"
                  placeholder="Your business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  maxLength={100}
                  disabled={!showBusinessName}
                />
                <CustomCheckbox checked={showBusinessName} onChange={() => setShowBusinessName((v) => !v)} label="Show business name" colorScheme={checkboxColors} />
                <TextInput
                  label="Designation"
                  placeholder="Your designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  maxLength={100}
                  disabled={!showDesignation}
                />
                <CustomCheckbox checked={showDesignation} onChange={() => setShowDesignation((v) => !v)} label="Show designation" colorScheme={checkboxColors} />
                <TextInput
                  label="Website"
                  placeholder="Your website www.example.com"
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                  maxLength={200}
                  disabled={!showWebsite}
                />
                <CustomCheckbox checked={showWebsite} onChange={() => setShowWebsite((v) => !v)} label="Show website" colorScheme={checkboxColors} />
                <TextInput
                  label="Address"
                  placeholder="Business address"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  maxLength={255}
                  disabled={!showAddress}
                />
                <CustomCheckbox checked={showAddress} onChange={() => setShowAddress((v) => !v)} label="Show address" colorScheme={checkboxColors} />
              </>
            ) : profileType === 'professional' ? (
              <>
                <CustomSelect
                  label="Professional Category"
                  placeholder={professionalDropdownOptions.length ? "Select a category" : "Select category"}
                  value={professionalCategories}
                  onChange={(e) => setProfessionalCategories(e.target.value)}
                  options={professionalDropdownOptions}
                  disabled={!showCategories}
                />
                <CustomCheckbox checked={showCategories} onChange={() => setShowCategories((v) => !v)} label="Show categories" colorScheme={checkboxColors} />
                {/*
                <TextInput
                  label="Business Name"
                  placeholder="Your business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  maxLength={100}
                  disabled={!showBusinessName}
                />
                <CustomCheckbox checked={showBusinessName} onChange={() => setShowBusinessName((v) => !v)} label="Show business name" colorScheme={checkboxColors} />
                */}
                <TextInput
                  label="Designation"
                  placeholder="Your role/title"
                  value={professionalDesignation}
                  onChange={(e) => setProfessionalDesignation(e.target.value)}
                  maxLength={100}
                  disabled={!showDesignation}
                />
                <CustomCheckbox checked={showDesignation} onChange={() => setShowDesignation((v) => !v)} label="Show designation" colorScheme={checkboxColors} />
                <TextInput
                  label="Website"
                  placeholder="Your website www.example.com"
                  value={professionalWebsite}
                  onChange={(e) => setProfessionalWebsite(e.target.value)}
                  maxLength={200}
                  disabled={!showWebsite}
                />
                <CustomCheckbox checked={showWebsite} onChange={() => setShowWebsite((v) => !v)} label="Show website" colorScheme={checkboxColors} />
                <TextInput
                  label="Address"
                  placeholder="Street address"
                  value={professionalAddress}
                  onChange={(e) => setProfessionalAddress(e.target.value)}
                  maxLength={255}
                  disabled={!showAddress}
                />
                <CustomCheckbox checked={showAddress} onChange={() => setShowAddress((v) => !v)} label="Show address" colorScheme={checkboxColors} />
              </>
            ) : profileType === 'social_work' ? (
              <>
                <TextInput
                  label="Designation"
                  placeholder="e.g., Social Worker, President"
                  value={socialWorkPosition}
                  onChange={(e) => setSocialWorkPosition(e.target.value)}
                  maxLength={100}
                  disabled={!showPosition}
                />
                <CustomCheckbox checked={showPosition} onChange={() => setShowPosition((v) => !v)} label="Show designation" colorScheme={checkboxColors} />
                <TextInput
                  label="Website"
                  placeholder="Your website www.example.com"
                  value={socialWorkWebsite}
                  onChange={(e) => setSocialWorkWebsite(e.target.value)}
                  maxLength={200}
                  disabled={!showWebsite}
                />
                <CustomCheckbox checked={showWebsite} onChange={() => setShowWebsite((v) => !v)} label="Show website" colorScheme={checkboxColors} />
                <TextInput
                  label="Address"
                  placeholder="Office / org address"
                  value={socialWorkAddress}
                  onChange={(e) => setSocialWorkAddress(e.target.value)}
                  maxLength={255}
                  disabled={!showAddress}
                />
                <CustomCheckbox checked={showAddress} onChange={() => setShowAddress((v) => !v)} label="Show address" colorScheme={checkboxColors} />
              </>
            ) : profileType === 'political' ? (
              <>
                <CustomSelect
                  label="Political Party / Organization Name"
                  placeholder="Select a party"
                  value={politicalPartyName}
                  onChange={(e) => setPoliticalPartyName(e.target.value)}
                  options={politicalPartyOptions}
                />
                <TextInput
                  label="Position / Role"
                  placeholder="Your role in the party"
                  value={politicalPosition}
                  onChange={(e) => setPoliticalPosition(e.target.value)}
                  maxLength={100}
                  disabled={!showPosition}
                />
                <CustomCheckbox checked={showPosition} onChange={() => setShowPosition((v) => !v)} label="Show position" colorScheme={checkboxColors} />
                {/* Temporarily hidden address option for political profile */}
                {/*
                <TextInput
                  label="Address"
                  placeholder="Office / party address"
                  value={politicalAddress}
                  onChange={(e) => setPoliticalAddress(e.target.value)}
                  maxLength={255}
                  disabled={!showAddress}
                />
                <CustomCheckbox checked={showAddress} onChange={() => setShowAddress((v) => !v)} label="Show address" colorScheme={checkboxColors} />
                */}

                {/* Political Social Links Section */}
                <div className="w-full rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
                  <CustomCheckbox
                    checked={showPoliticalSocialLinks}
                    onChange={() => setShowPoliticalSocialLinks((v) => !v)}
                    label="Show Social Links (Select max 2)"
                    colorScheme={checkboxColors}
                  />

                  {showPoliticalSocialLinks && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-gray-600 mb-3">Select up to 2 social links to display</p>
                      {[
                        { key: 'social_instagram', label: 'Instagram', url: instagramUrl },
                        { key: 'social_facebook', label: 'Facebook', url: facebookUrl },
                        { key: 'social_linkedin', label: 'LinkedIn', url: linkedinUrl },
                        { key: 'social_twitter', label: 'Twitter', url: twitterUrl },
                        { key: 'social_snapchat', label: 'Snapchat', url: snapchatUrl },
                        { key: 'social_youtube', label: 'YouTube', url: youtubeUrl },
                        { key: 'social_telegram', label: 'Telegram', url: telegramUrl },
                        { key: 'social_discord', label: 'Discord', url: discordUrl },
                      ].map(({ key, label, url }) => (
                        url && (
                          <label key={key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPoliticalSocialLinks.includes(key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selectedPoliticalSocialLinks.length < 2) {
                                    setSelectedPoliticalSocialLinks([...selectedPoliticalSocialLinks, key]);
                                  }
                                } else {
                                  setSelectedPoliticalSocialLinks(selectedPoliticalSocialLinks.filter(k => k !== key));
                                }
                              }}
                              disabled={
                                selectedPoliticalSocialLinks.length >= 2 && !selectedPoliticalSocialLinks.includes(key)
                              }
                              className="w-4 h-4 rounded cursor-pointer accent-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className={`text-sm ${selectedPoliticalSocialLinks.length >= 2 && !selectedPoliticalSocialLinks.includes(key) ? 'text-gray-400' : 'text-gray-700'}`}>
                              {label}
                            </span>
                          </label>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : profileType === 'brand' ? (
              <>
                <CustomSelect
                  label="Brands"
                  placeholder={brandDropdownOptions.length ? "Select a brands" : "Select brand"}
                  value={brandCategory}
                  onChange={(e) => setBrandCategory(e.target.value)}
                  options={brandDropdownOptions}
                />
                <TextInput
                  label="Online Presence"
                  placeholder="Brand website www.example.com"
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                  maxLength={200}
                  disabled={!showWebsite}
                />
                <CustomCheckbox checked={showWebsite} onChange={() => setShowWebsite((v) => !v)} label="Show website" colorScheme={checkboxColors} />
                <TextInput
                  label="Address"
                  placeholder="Brand office address"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  maxLength={255}
                  disabled={!showAddress}
                />
                <CustomCheckbox checked={showAddress} onChange={() => setShowAddress((v) => !v)} label="Show address" colorScheme={checkboxColors} />
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2.5">Short Bio</label>
                  <textarea
                    rows={3}
                    placeholder="A short bio about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 focus:bg-white hover:bg-white transition-all shadow-sm resize-y min-h-[100px]"
                  />
                </div>
                <div className="-mt-3">
                  <CustomCheckbox checked={showBio} onChange={() => setShowBio((v) => !v)} label="Show bio" colorScheme={checkboxColors} />
                </div>
                <TextInput label="Website (Optional)" type="url" placeholder="Personal website or portfolio" value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={200} />
                <div className="-mt-3">
                  <CustomCheckbox checked={showWebsite} onChange={() => setShowWebsite((v) => !v)} label="Show website" colorScheme={checkboxColors} />
                </div>
                <TextInput label="Address" placeholder="Your primary address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={!showAddress} maxLength={255} />
                <div className="-mt-3">
                  <CustomCheckbox checked={showAddress} onChange={() => setShowAddress((v) => !v)} label="Show address" colorScheme={checkboxColors} />
                </div>
              </>
            )}
          </div>
        </section>


        {/* ════ 4. SOCIAL LINKS ════ */}
        <section className="bg-white/80 backdrop-blur-xl h-fit border w-full lg:w-300 border-gray-200/80 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">

          <SectionHeader
            icon={Link}
            iconBg="bg-sky-50"
            iconColor="text-sky-500"
            title="Social Links"
          />
          <div className="p-7 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <TextInput
                label="INSTAGRAM"
                placeholder="Instagram profile URL"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                maxLength={100}
                disabled={!showInstagram}
              />
              <CustomCheckbox
                checked={showInstagram}
                onChange={() => setShowInstagram((v) => !v)}
                label="Show Instagram"
                colorScheme={checkboxColors}
              />
            </div>
            <div className="flex flex-col gap-3">
              <TextInput
                label="LINKEDIN"
                placeholder="LinkedIn profile URL"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                maxLength={100}
                disabled={!showLinkedin}
              />
              <CustomCheckbox
                checked={showLinkedin}
                onChange={() => setShowLinkedin((v) => !v)}
                label="Show LinkedIn"
                colorScheme={checkboxColors}
              />
            </div>
            <div className="flex flex-col gap-3">
              <TextInput
                label="FACEBOOK"
                placeholder="Facebook profile URL"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                maxLength={100}
                disabled={!showFacebook}
              />
              <CustomCheckbox
                checked={showFacebook}
                onChange={() => setShowFacebook((v) => !v)}
                label="Show Facebook"
                colorScheme={checkboxColors}
              />
            </div>
            <div className="flex flex-col gap-3">
              <TextInput
                label="TWITTER"
                placeholder="Twitter profile URL"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                maxLength={100}
                disabled={!showTwitter}
              />
              <CustomCheckbox
                checked={showTwitter}
                onChange={() => setShowTwitter((v) => !v)}
                label="Show Twitter"
                colorScheme={checkboxColors}
              />
            </div>
            <div className="flex flex-col gap-3">
              <TextInput
                label="SNAPCHAT"
                placeholder="Snapchat profile URL"
                value={snapchatUrl}
                onChange={(e) => setSnapchatUrl(e.target.value)}
                maxLength={100}
                disabled={!showSnapchat}
              />
              <CustomCheckbox
                checked={showSnapchat}
                onChange={() => setShowSnapchat((v) => !v)}
                label="Show Snapchat"
                colorScheme={checkboxColors}
              />
            </div>
            <div className="flex flex-col gap-3">
              <TextInput
                label="YOUTUBE"
                placeholder="YouTube channel URL"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                maxLength={100}
                disabled={!showYoutube}
              />
              <CustomCheckbox
                checked={showYoutube}
                onChange={() => setShowYoutube((v) => !v)}
                label="Show YouTube"
                colorScheme={checkboxColors}
              />
            </div>
            <div className="flex flex-col gap-3">
              <TextInput
                label="TELEGRAM"
                placeholder="Telegram profile URL"
                value={telegramUrl}
                onChange={(e) => setTelegramUrl(e.target.value)}
                maxLength={100}
                disabled={!showTelegram}
              />
              <CustomCheckbox
                checked={showTelegram}
                onChange={() => setShowTelegram((v) => !v)}
                label="Show Telegram"
                colorScheme={checkboxColors}
              />
            </div>
            <div className="flex flex-col gap-3">
              <TextInput
                label="DISCORD"
                placeholder="Discord profile URL"
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                maxLength={100}
                disabled={!showDiscord}
              />
              <CustomCheckbox
                checked={showDiscord}
                onChange={() => setShowDiscord((v) => !v)}
                label="Show Discord"
                colorScheme={checkboxColors}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ════ FAX FIELD ════ */}
      <div className="flex mt-8 mb-12 md:mb-8 justify-center">
        <button
          onClick={openFieldSelector}
          disabled={saveState !== "idle"}
          className={`inline-flex w-[280px] cursor-pointer md:w-[350px] lg:w-[400px] items-center justify-center gap-2 md:gap-2.5 text-white px-6 py-2.5 md:px-8 md:py-3.5 rounded-xl font-semibold text-sm md:text-base border shadow-lg transition-all duration-200 focus:ring-4 outline-none
                  ${saveState === "saved"
              ? "bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-600/50 shadow-emerald-500/20 cursor-not-allowed"
              : saveState === "saving"
                ? "bg-gradient-to-b " + buttonColors.saving + " cursor-not-allowed"
                : "bg-gradient-to-b " + buttonColors.primary
            }`}
        >
          {saveState === "saving" && <RefreshCw size={18} className="animate-spin" />}
          {saveState === "saved" && <CheckCircle size={18} strokeWidth={2.5} />}
          {saveState === "saving" ? "Saving Profile..."
            : saveState === "saved" ? "Changes Saved!"
              : "Save Profile"}
        </button>
      </div>
      <FieldSelectorModal
        isOpen={isFieldSelectorOpen}
        profileType={profileType}
        initialSelectedFields={selectedFields}
        onClose={handleFieldSelectorClose}
        onConfirm={handleFieldSelectorConfirm}
      />
      <BottomNavbar isAuthenticated={true} />
    </div>
  );
}
