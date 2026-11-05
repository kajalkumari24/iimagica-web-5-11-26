import React, { useEffect, useState, useMemo } from "react";
import axios from "../axiosConfig";
import styles from "./MyProfile.module.css";
import { BASE_URL } from "../url";
import { useNavigate } from "react-router-dom";
import Header from "../page/Header/Header";
import homeStyles from "../page/Home/Home.module.css";
import Lottie from "lottie-react";
import SpaceLottie from "../Lotties/Space.json";
import { toast } from "react-toastify";
import ImageUpload from "./ProfileSections/ImageUpload";
import PersonalInfo from "./ProfileSections/PersonalInfo";
import Location from "./ProfileSections/Location";
import ProfileTypeFields from "./ProfileSections/ProfileTypeFields";
import SocialLinks from "./ProfileSections/SocialLinks";
import SubmitRow from "./ProfileSections/SubmitRow";
import BottomNavbar from '../components/BottomNavbar';
import FieldSelectorModal from "./ProfileSections/FieldSelectorModal";
import socket from "../socket";

const MyProfile = () => {
  const navigate = useNavigate();

  const stripCountryCodeForDisplay = (value) => {
    const digits = String(value || "").replace(/\D/g, "");

    if (digits.length === 12 && digits.startsWith("91")) {
      return digits.slice(2);
    }

    return String(value || "");
  };

  const [profile, setProfile] = useState(null);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [profileType, setProfileType] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [pendingSaveAfterFieldSelection, setPendingSaveAfterFieldSelection] = useState(false);
  const [professionalTypes, setProfessionalTypes] = useState([]);

  // make fetchProfile reusable so other code (e.g., after save) can refresh UI from server
  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/profiles/me`, {
        withCredentials: true,
      });
      const fetchedProfile = res.data.profile || res.data || {};
      
      // Normalize selectedDisplayFields (treat mobile and contact as same)
      if (fetchedProfile.selectedDisplayFields && Array.isArray(fetchedProfile.selectedDisplayFields)) {
        const normalized = fetchedProfile.selectedDisplayFields.map(f => {
          const lowered = String(f || '').toLowerCase();
          if (lowered === 'contact' || lowered === 'mobile') return 'mobile';
          return f;
        });
        fetchedProfile.selectedDisplayFields = [...new Set(normalized)];
      }
      
      // Simple file URL construction
      const fullUrl = fetchedProfile.file
        ? (fetchedProfile.file.startsWith("http") ? fetchedProfile.file : `${BASE_URL}${fetchedProfile.file}`)
        : null;

      fetchedProfile.mobile = stripCountryCodeForDisplay(fetchedProfile.mobile);
      
      const subStatus = res.data.subscription?.subscriptionStatus;
      setProfile({ ...fetchedProfile, fileUrl: fullUrl, subscriptionStatus: subStatus });
      setFormData(fetchedProfile);
      setProfileType(fetchedProfile.profileType || "");
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Failed to load profile ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/profile-types/professional`);
        setProfessionalTypes(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching professions:", err);
      }
    };

    fetchProfessions();
    fetchProfile();
  }, []);

  // Real-time: when admin updates profile types, refresh profile data
  useEffect(() => {
    const handler = () => fetchProfile();
    socket.on('profileTypeUpdated', handler);
    return () => socket.off('profileTypeUpdated', handler);
  }, []);
 // Escape key handler for delete modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape" && showDeleteModal) {
        setShowDeleteModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showDeleteModal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleProfileTypeChange = (newType, previousType) => {
    setProfileType(newType);
    setFormData(prev => ({ ...prev, profileType: newType }));
    // Only clear selectedDisplayFields when switching TO political (no popup for political)
    if (newType === "political") {
      setFormData(prev => ({ ...prev, selectedDisplayFields: [] }));
    }
    setShowFieldSelector(false);
  };

  const normalizeSelectedFields = (selectedFields = []) => {
    const normalized = selectedFields.map((f) => {
      const lowered = String(f || "").toLowerCase();
      if (lowered === "contact" || lowered === "mobile") return "mobile";
      return f;
    });
    return [...new Set(normalized)];
  };

  const fieldLabelMap = {
    name: "Name",
    businessName: "Business Name",
    designation: "Designation",
    website: "Website",
    bio: "Bio",
    organization: "Organization",
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
    if (key === "mobile" || key === "contact") return formData.contact || formData.mobile;
    if (key === "organization") return formData.organization || formData.partyname;
    return formData[fieldKey];
  };

  const isFieldFilled = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setProfile((p) => ({ ...(p || {}), fileUrl: URL.createObjectURL(f) }));
  };

  const handleRemoveBackground = async () => {
    // Support removing background for either a newly-selected local file
    // (send multipart/form-data) or an already-uploaded image URL
    // (send JSON { imageUrl }). Backend accepts both.
    if (!file && !(profile && profile.fileUrl)) return toast.info("Select an image first");
    setIsImageProcessing(true);
    try {
      let res;
      if (file) {
        const data = new FormData();
        data.append("file", file);
        res = await axios.post(`${BASE_URL}/api/images/remove-bg`, data, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
      } else {
        // use existing uploaded file URL
        res = await axios.post(
          `${BASE_URL}/api/images/remove-bg`,
          { imageUrl: profile.fileUrl },
          { withCredentials: true }
        );
      }

      if (res && res.data && res.data.fileUrl) {
        setProfile((p) => ({ ...(p || {}), fileUrl: res.data.fileUrl }));
        setFormData((prev) => ({ ...(prev || {}), fileUrl: res.data.fileUrl, public_id: res.data.public_id || prev?.public_id, file: null }));
        setFile(null);
      }
    } catch (err) {
      console.error('Remove BG error', err?.response || err.message || err);
      toast.error("Background removal failed");
    } finally {
      setIsImageProcessing(false);
    }
  };

  const handleDeleteImage = async () => {
    setShowDeleteModal(false);
    try {
      if (!profile || !profile.fileUrl) return toast.info("No image to delete");
      setIsImageProcessing(true);
      const publicIdToSend = formData.public_id || profile.public_id || null;
      const params = {};
      if (publicIdToSend) params.public_id = publicIdToSend;
      else params.fileUrl = profile.fileUrl;

      await axios.delete(`${BASE_URL}/api/images`, {
        params,
        withCredentials: true,
      });
      setProfile((p) => ({ ...(p || {}), fileUrl: null }));
      setFile(null);
      setFormData((prev) => ({ ...(prev || {}), fileUrl: null, public_id: null }));
      toast.success("Image deleted");
    } catch (err) {
      console.error('Delete image error', err?.response || err.message || err);
      toast.error("Failed to delete image");
    } finally {
      setIsImageProcessing(false);
    }
  };

  const saveProfile = async (selectedFieldsOverride = null, formDataOverride = null) => {
    setIsSaving(true);
    
    const currentFormData = formDataOverride || formData;
    
    try {
      const data = new FormData();
      const resolvedProfileType = profileType || currentFormData.profileType;

      const appendField = (key, value, allowEmpty = false) => {
        if (value === undefined || value === null) return;
        if (!allowEmpty && typeof value === "string" && value.trim() === "") return;
        data.append(key, value);
      };

      const fieldsToSend = {
        // Common top-level fields
        name: currentFormData.name,
        mobile: currentFormData.mobile,
        email: currentFormData.email,
        city: currentFormData.city,
        state: currentFormData.state,
        country: currentFormData.country,
        address: currentFormData.address,
        gender: currentFormData.gender,
        religion: currentFormData.religion,
        birthDate: currentFormData.birthDate,
        fax: currentFormData.fax,
        profileType: resolvedProfileType,

        // Profile-type fields
        partyname: currentFormData.partyname,
        positionname: currentFormData.positionname,
        businessName: currentFormData.businessName,
        businessTagline: currentFormData.businessTagline,
        designation: currentFormData.designation,
        categories: currentFormData.categories,
        brandName: currentFormData.brandName,
        bio: currentFormData.bio,
        organization: currentFormData.organization || currentFormData.partyname,
        website: currentFormData.website,
      };

      Object.entries(fieldsToSend).forEach(([key, value]) => {
        appendField(key, value, key === "address");
      });

      // Keep explicit empty address updates for clearing old saved value
      if (currentFormData.address !== undefined) data.set("address", currentFormData.address || "");

      // Social handles
      [
        "social_instagram",
        "social_facebook",
        "social_linkedin",
        "social_twitter",
        "social_snapchat",
        "social_youtube",
        "social_telegram",
        "social_discord",
      ].forEach((key) => appendField(key, currentFormData[key] || "", true));

      // Visibility toggles (global + type-specific)
      [
        "visibleName",
        "showMobile",
        "showFax",
        "showProfileImage",
        "showBusinessName",
        "showBusinessTagline",
        "showCategories",
        "showDesignation",
        "showPosition",
        "showWebsite",
        "showAddress",
        "showInstagram",
        "showFacebook",
        "showLinkedIn",
        "showTwitter",
        "showSnapchat",
        "showYouTube",
        "showTelegram",
        "showDiscord",
      ].forEach((key) => {
        if (currentFormData[key] !== undefined && currentFormData[key] !== null) {
          appendField(key, currentFormData[key]);
        }
      });

      const selectedDisplayFields = Array.isArray(selectedFieldsOverride)
        ? selectedFieldsOverride
        : currentFormData.selectedDisplayFields;
      if (selectedDisplayFields && Array.isArray(selectedDisplayFields)) {
        data.append("selectedDisplayFields", JSON.stringify(selectedDisplayFields));
      }
      
      if (file) {
        data.append("file", file);
      } else if (currentFormData.fileUrl && currentFormData.fileUrl !== profile.file) {
        data.append("fileUrl", currentFormData.fileUrl);
        if (currentFormData.public_id) data.append("public_id", currentFormData.public_id);
      }

      const response = await axios.put(`${BASE_URL}/api/profiles/me`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      await fetchProfile();
      setFile(null);
      toast.success("Profile updated successfully ✅", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Force the protected home route after a successful save.
      setTimeout(() => {
        window.location.replace("/home");
      }, 800);
    } catch (error) {
      console.error("Update error:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || "Error updating profile";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldSelectionConfirm = async (selectedFields) => {
    const deduplicated = normalizeSelectedFields(selectedFields);

    const missingFields = deduplicated.filter((fieldKey) => !isFieldFilled(getSelectedFieldValue(fieldKey)));
    if (missingFields.length > 0) {
      const pretty = missingFields
        .map((fieldKey) => fieldLabelMap[fieldKey] || fieldLabelMap[String(fieldKey || "").toLowerCase()] || fieldKey)
        .join(", ");
      toast.warn(`Please fill selected fields first: ${pretty}`);
      return;
    }

    // Merge selectedDisplayFields into formData snapshot BEFORE saving
    const updatedFormData = { ...formData, selectedDisplayFields: deduplicated };
    setFormData(updatedFormData);
    setShowFieldSelector(false);

    if (pendingSaveAfterFieldSelection) {
      setPendingSaveAfterFieldSelection(false);
      // Pass updatedFormData directly so saveProfile uses latest data
      await saveProfile(deduplicated, updatedFormData);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    // Political profiles skip the field selector popup
    if (profileType === "political") {
      await saveProfile();
      return;
    }
    setPendingSaveAfterFieldSelection(true);
    setShowFieldSelector(true);
  };

  const isFormValid = useMemo(() => {
    if (!profileType) return false;
    if (profileType === "political") return Boolean(formData.partyname && String(formData.partyname).trim());
    if (profileType === "professional") return Boolean(formData.categories && String(formData.categories).trim());
    if (profileType === "brand") return Boolean(formData.brandName && String(formData.brandName).trim());
    return true;
  }, [profileType, formData.partyname, formData.categories, formData.brandName]);

  if (loading) {
    return (
      <div className={homeStyles.container}>
        <div className={homeStyles.loadingScreen}>
          <div className={homeStyles.spinner}></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }
  if (!profile) return <p className={styles.loading}>No profile found.</p>;

  return (
    <div className={homeStyles.container}>
      <div className={styles.lottieWrapper} aria-hidden>
        <Lottie animationData={SpaceLottie} loop={true} />
      </div>

      <div className={homeStyles.content}>
        <Header />
        <main style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "40px" }}>
          <div className={styles.mainContainer}>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>My Profile</h1>
              <button 
                type="submit" 
                onClick={handleUpdate}
                disabled={isSaving || !isFormValid}
                className={styles.topSaveBtn}
              >
                {isSaving ? (
                  <>
                    <span className={styles.spinner}></span>
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
            
            {profile?.subscriptionStatus === 'expired' && (
              <div style={{
                background: "rgba(255, 107, 122, 0.1)", border: "1px solid #ff6b7a",
                color: "#ff6b7a", padding: "14px", borderRadius: "8px", marginBottom: "20px",
                textAlign: "center", fontSize: "15px"
              }}>
                <strong>Warning:</strong> Your subscription has expired! You cannot access templates or download images. Please <span style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: "bold" }} onClick={() => navigate('/pricing')}>Upgrade your plan</span> to unlock all features.
              </div>
            )}
            <p className={styles.pageSubtitle}>Update your profile information and manage your visibility settings</p>

            {formErrors && Object.keys(formErrors).length > 0 && (
              <div style={{ color: "#9b1c1c", background: "#fff1f0", padding: "10px", borderRadius: 4, marginBottom: 12 }}>
                <strong>Validation errors:</strong>
                <ul style={{ margin: "6px 0 0 16px" }}>
                  {Object.keys(formErrors).map((k) => (
                    <li key={k}>{k}: {String(formErrors[k])}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleUpdate} className={styles.formWrapper}>
              <ImageUpload
                profile={profile}
                file={file}
                handleFileChange={handleFileChange}
                isImageProcessing={isImageProcessing}
                handleRemoveBackground={handleRemoveBackground}
                handleDeleteImage={() => setShowDeleteModal(true)}
                formData={formData}
                setFormData={setFormData}
              />

              <div className={styles.formContent}>
                {/* General info always visible */}
                <PersonalInfo
                  formData={formData}
                  handleChange={handleChange}
                  setFormData={setFormData}
                  phoneLocked={Boolean(formData.phoneLocked)}
                />
                <Location formData={formData} handleChange={handleChange} />

                {/* Profile type specific block (renders fields for the selected type) */}
                <ProfileTypeFields
                  profileType={profileType}
                  setProfileType={setProfileType}
                  formData={formData}
                  handleChange={handleChange}
                  setFormData={setFormData}
                  professionalTypes={professionalTypes}
                  onProfileTypeChange={handleProfileTypeChange}
                />

                {/* Show social links for all profile types */}
                <SocialLinks formData={formData} handleChange={handleChange} setFormData={setFormData} />

                <SubmitRow isSaving={isSaving} />
              </div>
            </form>
          </div>
        </main>
      </div>
      
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Delete Image</h3>
            <p>Are you sure you want to delete this image? This will remove it from server and your profile.</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)} className={styles.btnCancel}>Cancel</button>
              <button onClick={handleDeleteImage} className={styles.btnDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <FieldSelectorModal
        isOpen={showFieldSelector}
        profileType={profileType}
        initialSelectedFields={formData.selectedDisplayFields || []}
        onClose={() => {
          setShowFieldSelector(false);
          setPendingSaveAfterFieldSelection(false);
        }}
        onConfirm={handleFieldSelectionConfirm}
      />

      <BottomNavbar isAuthenticated={true} />
    </div>
  );
};

export default MyProfile;
