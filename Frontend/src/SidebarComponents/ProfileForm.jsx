import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import { FaSquareInstagram, FaXTwitter } from "react-icons/fa6";
import style from "./ProfileForm.module.css";
import { BASE_URL } from "../url";
// import { BASE_URL } from "./url"; // ✅ Add this line

import Header from "../page/Header/Header";

import Lottie from "lottie-react";
import SpaceLottie from "../Lotties/Space.json";

function ProfileForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);

  // ✅ Get email and selected profile from previous page
  const email = location.state?.email || "";
  // accept either `selectedProfile` or legacy `profileType` key
  // NOTE: default to empty so user must explicitly pick a profile type
  const selectedProfile = location.state?.selectedProfile || location.state?.profileType || "";

  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState({
    profiletype: selectedProfile, // ✅ added profiletype
    name: "",
    partyname: "",
    positionname: "",
    mobile: "",
    email: email, // ✅ prefill email
    language: "",
    religion: "",
    birthDate: "",
    gender: "",
    state: "",
    city: "",
    address: "",
    socialLinks: {
      instagram: "",
      twitter: "",
      facebook: "",
      linkedin: "",
    },
    file: null, // ✅ added file
    showProfileImage: true, // whether to display profile image in /image-view
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profileImage, setProfileImage] = useState("/upload.jpeg");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState("");

  // computed flags for enabling submit
  const isPoliticalProfile = Boolean(formData.profiletype && String(formData.profiletype).toLowerCase().includes("polit"));
  const canSubmit = !loading && Boolean(formData.profiletype) && (!isPoliticalProfile || Boolean(formData.partyname && String(formData.partyname).trim() !== ""));

  // If user already has a profile and this page was NOT opened as part of selection
  // (i.e. no selectedProfile in route state), redirect to /home so existing users
  // don't see the creation form accidentally.
  useEffect(() => {
    const loadProfileIfAny = async () => {
      try {
        // If the user came from the selection flow and provided a selectedProfile,
        // we want to allow creation (don't overwrite with existing data unless it exists).
        const res = await fetch(`${BASE_URL}/api/profiles/me`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const fetched = data.profile || data;

          // Populate form with existing profile (edit mode)
          setProfile({ ...fetched, fileUrl: fetched.file ? `${BASE_URL}${fetched.file}` : null });
          setFormData({
            ...formData,
            profiletype: fetched.profiletype || formData.profiletype,
            name: fetched.name || "",
            partyname: fetched.partyname || "",
            positionname: fetched.positionname || "",
            mobile: fetched.mobile || "",
            email: fetched.email || formData.email,
            language: fetched.language || "",
            religion: fetched.religion || "",
            birthDate: fetched.birthDate ? fetched.birthDate.split("T")[0] : "",
            gender: fetched.gender || "",
            state: fetched.state || "",
            city: fetched.city || "",
            address: fetched.address || "",
            socialLinks: {
              instagram: fetched.instatext || fetched.socialLinks?.instagram || "",
              twitter: fetched.social_twitter || fetched.socialLinks?.twitter || "",
              facebook: fetched.social_facebook || fetched.socialLinks?.facebook || "",
              linkedin: fetched.social_linkedin || fetched.socialLinks?.linkedin || "",
            },
            file: null,
            showProfileImage: typeof fetched.showProfileImage !== 'undefined' ? fetched.showProfileImage : true,
          });

          if (fetched.file) setProfileImage(fetched.file);
          setProfileType(fetched.profiletype || "");
          setIsEditing(true);
        } else {
          // no existing profile — stay in create mode
          setIsEditing(false);
        }
      } catch (err) {
        console.debug("profile load failed", err);
      }
    };

    loadProfileIfAny();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Fetch parties
  useEffect(() => {
    const fetchParties = async () => {
      // No backend parties endpoint exists; keep fallback list as source of truth.
      setParties([
        "bjp",
        "congress",
        "aap",
        "bsp",
        "cpi",
        "ncp",
        "npp",
        "Other",
      ]);
    };
    fetchParties();
  }, []);

  // ✅ Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.post(
          "https://countriesnow.space/api/v0.1/countries/states",
          { country: "India" }
        );
        setStates(res.data.data.states.map((s) => s.name));
      } catch { }
    };
    fetchStates();
  }, []);

  // ✅ Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      if (formData.state) {
        try {
          const res = await axios.post(
            "https://countriesnow.space/api/v0.1/countries/state/cities",
            { country: "India", state: formData.state }
          );
          setCities(res.data.data);
        } catch { }
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [formData.state]);

  // Create particle stars similar to Home
  useEffect(() => {
    const NUM_PARTICLES = 80;
    const tempParticles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      tempParticles.push({
        id: i,
        style: {
          top: `${Math.random() * 100}vh`,
          left: `${Math.random() * 100}vw`,
          width: `${Math.random() * 3 + 1}px`,
          height: `${Math.random() * 3 + 1}px`,
          animationDuration: `${Math.random() * 20 + 10}s`,
          animationDelay: `${Math.random() * 10}s`,
        },
      });
    }
    setParticles(tempParticles);
  }, []);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // checkbox handling (e.g., showProfileImage)
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // ✅ Profiletype change → navigate
    if (name === "profiletype") {
      // normalize check for political types (allow 'political', 'Political', etc.)
      const isPolitical = typeof value === "string" && value.toLowerCase().includes("polit");

      // if switching away from political, clear party selection
      const newData = { ...formData, profiletype: value };
      if (!isPolitical) newData.partyname = "";

      setFormData(newData);

      if (value === "business") navigate("/myprofile");
      if (value === "political") navigate("/myprofile");
      if (value === "Professional") navigate("/profile-selection/profile-prof");
      if (value === "Personal") navigate("/profile-selection/profile-personal");
      if (value === "Social Worker") navigate("/profile-selection/profile-social");

      return;
    }

    // ✅ Custom Party
    if (name === "partyname" && value === "Other") {
      const customParty = prompt("Enter your Party Name:");
      if (customParty && customParty.trim() !== "") {
        setFormData((prev) => ({ ...prev, partyname: customParty }));
        setParties((prev) => [
          ...prev.filter((p) => p !== "Other"),
          customParty,
          "Other",
        ]);
      }
    } else if (name.startsWith("social_")) {
      const platform = name.split("_")[1];
      setFormData((prev) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [platform]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };


  const handleRemoveBackground = async () => {
    if (!formData.file) return alert("Please upload an image first!");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", formData.file);

      const res = await axios.post(`${BASE_URL}/api/images/remove-bg`, fd, {
        withCredentials: true,
      });

      if (res?.data?.fileUrl) {
        const fileUrl = res.data.fileUrl;
        const fetched = await fetch(fileUrl);
        const blob = await fetched.blob();
        const newFile = new File([blob], formData.file.name, { type: 'image/png' });
        setProfileImage(fileUrl);
        setFormData((prev) => ({ ...prev, file: newFile }));
      } else {
        throw new Error('remove-bg proxy returned no fileUrl');
      }
    } catch (error) {
      console.error("Error removing background:", error);
      alert("Error removing background. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // ✅ Image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();

      // ✅ Normal fields
      data.append("profiletype", formData.profiletype);
      data.append("name", formData.name);
      // data.append("categories", formData.category); // backend ke hisaab se
      data.append("partyname", formData.partyname);
      data.append("positionname", formData.positionname);
      data.append("designation", formData.designation);
      data.append("mobile", formData.mobile);
      data.append("email", formData.email);
      data.append("language", formData.language);
      data.append("religion", formData.religion);
      data.append("birthDate", formData.birthDate);
      data.append("gender", formData.gender);
      data.append("state", formData.state);
      data.append("city", formData.city);

      // ✅ Social links mapping
      data.append("instatext", formData.socialLinks.instagram);
      data.append("social_twitter", formData.socialLinks.twitter);
      data.append("social_facebook", formData.socialLinks.facebook);
      data.append("social_linkedin", formData.socialLinks.linkedin);

      // ✅ Show/hide profile image flag (send as string)
      data.append("showProfileImage", formData.showProfileImage ? "true" : "false");

      // ✅ Image file bhejo
      if (formData.file) {
        data.append("file", formData.file);
      }

      if (isEditing) {
        await axios.put(`${BASE_URL}/api/profiles/me`, data, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
      } else {
        await axios.post(`${BASE_URL}/api/profiles`, data, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
      }
      setMessage("Profile submitted successfully!");
      navigate("/home");
    } catch (error) {
      const errMsg = error.response?.data?.message;
      setMessage(errMsg || "Something went wrong!");

      // If backend says profile already exists, treat it as success and continue to home
      if (errMsg && errMsg.toLowerCase().includes("profile already exists")) {
        // small delay so user can read message, then redirect
        setTimeout(() => navigate("/home"), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060a1e", position: "relative", overflow: "hidden" }}>
      {/* Particles (stars) like Home */}
      {particles.map((p) => (
        <div key={p.id} style={{ position: "fixed", borderRadius: "50%", background: "rgba(255,255,255,0.7)", zIndex: 12, ...p.style }} />
      ))}

      {/* Lottie background to match Home */}
      <div className={style.lottieWrapper} aria-hidden>
        <Lottie animationData={SpaceLottie} loop={true} />
      </div>

      <div style={{ position: "relative", zIndex: 30, paddingTop: "70px" }}>
        <Header />

        <main style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <section className={style.profileContainer}>
            <h2 className={style.formTitle}>Profile</h2>
            <h3 className={style.formSubtitle}>Selected Profile: {formData.profiletype}</h3>

            <form onSubmit={handleSubmit} className={style.profileForm}>
              <div className={style.uploadContainer}>
                <label htmlFor="imageUpload" className={style.uploadBox}>
                  <img src={profileImage} alt="Upload" className={style.uploadImage} />
                </label>

                <input id="imageUpload" type="file" accept="image/*" className={style.hiddenInput} onChange={handleImageChange} />

                <p className={style.uploadText}>Upload Photo</p>

                {/* Toggle: show profile image in public preview */}
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      name="showProfileImage"
                      checked={formData.showProfileImage}
                      onChange={handleChange}
                    />
                    <span>Show profile image in preview</span>
                  </label>
                </div>

                {formData.file && (
                  <button type="button" className={style.bgRemoveButton} onClick={handleRemoveBackground} disabled={loading}>
                    {loading ? "Removing Background..." : "Remove Background"}
                  </button>
                )}
              </div>

              {/* Profile Type Select */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>Profile Type</label>
                <select name="profiletype" value={formData.profiletype} onChange={handleChange} className={`${style.profileInput} ${style.customSelect}`}>
                  <option value="">Profile Type</option>
                  <option value="business">business</option>
                  <option value="political">political</option>
                  <option value="professional">professional</option>
                  <option value="Personal">personal</option>
                  <option value="SocialWork ">social</option>
                </select>
              </div>

              {/* Name */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>Your Name</label>
                <input type="text" name="name" value={formData.name} placeholder="Enter your full name" onChange={handleChange} className={style.profileInput} />
              </div>

              {/* Party Name - only show for political profiles */}
              {(() => {
                const isPolitical = formData.profiletype && String(formData.profiletype).toLowerCase().includes("polit");
                if (!isPolitical) return null;
                return (
                  <div className={style.formGroup}>
                    <label className={style.formLabel}>Party Name</label>
                    <select name="partyname" value={formData.partyname} onChange={handleChange} className={`${style.profileInput} ${style.customSelect}`}>
                      <option value="">Select Party</option>
                      {parties.map((party, index) => (
                        <option key={index} value={party}>{party}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {/* Position */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>Position in Party</label>
                <input type="text" name="positionname" value={formData.positionname} placeholder="e.g., Youth Leader" onChange={handleChange} className={style.profileInput} />
              </div>

              {/* Mobile */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>Mobile</label>
                <input type="text" name="mobile" value={formData.mobile} placeholder="Enter mobile number" onChange={handleChange} className={style.profileInput} />
              </div>

              {/* Email */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>Email</label>
                <input type="email" name="email" value={formData.email} placeholder="Enter email" onChange={handleChange} className={style.profileInput} />
              </div>
              {/*/Website*/}
              <div className={style.formGroup}>
                <label className={style.formLabel}>Website</label>
                <input type="text" name="website" value={formData.website} placeholder="Enter website" onChange={handleChange} className={style.profileInput} />
              </div>

              {/* Language */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>Language</label>
                <input type="text" name="language" value={formData.language} placeholder="Enter language" onChange={handleChange} className={style.profileInput} />
              </div>

              {/* Religion */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>Religion</label>
                <input type="text" name="religion" value={formData.religion} placeholder="Enter religion" onChange={handleChange} className={style.profileInput} />
              </div>

              {/* Birth Date */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>Date of Birth</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className={style.profileInput} />
              </div>

              {/* Gender */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={`${style.profileInput} ${style.customSelect}`}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* State */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>State</label>
                <select name="state" value={formData.state} onChange={handleChange} className={`${style.profileInput} ${style.customSelect}`}>
                  <option value="">Select State</option>
                  {states.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className={style.formGroup}>
                <label className={style.formLabel}>City</label>
                <select name="city" value={formData.city} onChange={handleChange} className={`${style.profileInput} ${style.customSelect}`}>
                  <option value="">Select City</option>
                  {cities.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Address */}
              {!isPoliticalProfile && (
                <div className={style.formGroup}>
                  <label className={style.formLabel}>Address</label>
                  <textarea name="address" value={formData.address} placeholder="Enter your full address" onChange={handleChange} className={style.profileInput} />
                </div>
              )}

              {/* Social Media Links */}
              <div className={style.formGroup}>
                <label className={style.formLabel}><FaSquareInstagram /> Instagram</label>
                <input type="text" name="social_instagram" value={formData.socialLinks.instagram} placeholder="Instagram profile link" onChange={handleChange} className={style.profileInput} />
              </div>

              <div className={style.formGroup}>
                <label className={style.formLabel}><FaXTwitter /> Twitter</label>
                <input type="text" name="social_twitter" value={formData.socialLinks.twitter} placeholder="Twitter profile link" onChange={handleChange} className={style.profileInput} />
              </div>

              <div className={style.formGroup}>
                <label className={style.formLabel}><FaFacebook /> Facebook</label>
                <input type="text" name="social_facebook" value={formData.socialLinks.facebook} placeholder="Facebook profile link" onChange={handleChange} className={style.profileInput} />
              </div>

              <div className={style.formGroup}>
                <label className={style.formLabel}><FaLinkedin /> LinkedIn</label>
                <input type="text" name="social_linkedin" value={formData.socialLinks.linkedin} placeholder="LinkedIn profile link" onChange={handleChange} className={style.profileInput} />
              </div>

              <div className={style.formSubmit}>
                <button type="submit" disabled={!canSubmit} aria-disabled={!canSubmit}>{loading ? "Submitting..." : "Submit"}</button>
                {!formData.profiletype && (
                  <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>Please select a profile type to continue.</div>
                )}
                {formData.profiletype && isPoliticalProfile && (!formData.partyname || String(formData.partyname).trim() === "") && (
                  <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>Political profile requires selecting a party.</div>
                )}
              </div>
            </form>

            {message && <p className={style.formMessage}>{message}</p>}
          </section>
        </main>
      </div>
    </div>
  );
}

export default ProfileForm;
