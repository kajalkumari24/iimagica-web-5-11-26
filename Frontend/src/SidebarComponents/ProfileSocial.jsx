import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import { FaSquareInstagram, FaXTwitter } from "react-icons/fa6";
import style from "./ProfileSocial.module.css";
import { FaBars } from "react-icons/fa";
import { BASE_URL } from "../url";

function ProfileSocial() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const email = location.state?.email || "";
  const selectedProfile = location.state?.profileType || "Political";

  const [parties, setParties] = useState([]);
  const [formData, setFormData] = useState({
    profiletype: "social",
    name: "",
    partyname: "",
    positionname: "",
    mobile: "",
    email: email,
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
    file: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profileImage, setProfileImage] = useState("/upload.jpeg");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // ✅ Fetch parties
  useEffect(() => {
    const fetchParties = async () => {
      // No backend parties endpoint exists; keep fallback list as source of truth.
      setParties(["ABVP", "RSS", "JAYS PARTY", "BAJRANG DAL", "Other"]);
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

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "profiletype") {
      setFormData((prev) => ({ ...prev, profiletype: value }));

      if (value === "Business") navigate("/profile-selection/profile-bus");
      if (value === "Political") navigate("/profile-selection/profile-form");
      if (value === "Professional") navigate("/profile-selection/profile-prof");
      if (value === "Personal") navigate("/profile-selection/profile-personal");
      if (value === "Social Worker")
        navigate("/profile-selection/profile-social");

      return;
    }

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

  // ✅ Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, file }));
  };

  // ✅ Remove Background
  const handleRemoveBackground = async () => {
    if (!formData.file) {
      alert("Please upload an image first!");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', formData.file);
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
      alert("Background removal failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "socialLinks" && key !== "file") data.append(key, value);
      });

      Object.entries(formData.socialLinks).forEach(([k, v]) =>
        data.append(`social_${k}`, v)
      );

      if (formData.file) data.append("file", formData.file);

      await axios.post(`${BASE_URL}/api/profiles`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setMessage("Profile submitted successfully!");
      navigate("/home");
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={style.mainContainer}>
      {/* Sidebar */}
      <div
        className={style.sidebar}
        style={{ width: isSidebarOpen ? "250px" : "60px" }}
      >
        <div
          className={style.collapseButton}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <FaBars />
        </div>

        <h2
          className={style.sidebarTitle}
          style={{ display: isSidebarOpen ? "block" : "none" }}
        >
          Menu
        </h2>

        <ul className={style.sidebarList}>
          <li>
            <Link to="/profile-selection/profile-form">
              {isSidebarOpen && "Profile"}
            </Link>
          </li>
          <li>
            <Link to="/premium">{isSidebarOpen && "My Premium"}</Link>
          </li>
          <li>
            <Link to="/help">{isSidebarOpen && "Help & Support"}</Link>
          </li>
        </ul>
      </div>

      {/* Profile Form */}
      <div className={style.profileContainer}>
        <h2 className={style.formTitle}>Profile</h2>

        <form onSubmit={handleSubmit} className={style.profileForm}>
          {/* Upload Section */}
          <div className={style.uploadContainer}>
            <label htmlFor="imageUpload" className={style.uploadBox}>
              <img
                src={profileImage}
                alt="Upload"
                className={style.uploadImage}
              />
            </label>

            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              className={style.hiddenInput}
              onChange={handleImageChange}
            />

            {/* 🧹 Remove Background Button */}
            {formData.file && (
              <button
                type="button"
                className={style.removeBgBtn}
                onClick={handleRemoveBackground}
                disabled={loading}
              >
                {loading ? "Removing..." : "Remove Background"}
              </button>
            )}

            <p className={style.uploadText}>Upload Photo</p>
          </div>
          {/* ✅ Profile Type Select */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Profile Type</label>
            <select
              name="profiletype"
              value={formData.profiletype}
              onChange={handleChange}
              className={style.profileInput}
            >
              <option value="">Profile Type</option>
              <option value="Business">business</option>
              <option value="Political">political</option>
              <option value="Professional">professional</option>
              <option value="Personal">personal</option>
              <option value="social">social</option>
            </select>
          </div>

          {/* Name */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Your Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              placeholder="Enter your full name"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          {/* Party Name */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Party Name</label>
            <select
              name="partyname"
              value={formData.partyname}
              onChange={handleChange}
              className={style.profileInput}
            >
              <option value="">Select Party</option>
              {parties.map((party, index) => (
                <option key={index} value={party}>
                  {party}
                </option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Position in Party</label>
            <input
              type="text"
              name="positionname"
              value={formData.positionname}
              placeholder="e.g., Youth Leader"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          {/* Mobile */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Mobile</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              placeholder="Enter mobile number"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          {/* Email */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              placeholder="Enter email"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          {/* Language */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Language</label>
            <input
              type="text"
              name="language"
              value={formData.language}
              placeholder="Enter language"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          {/* Religion */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Religion</label>
            <input
              type="text"
              name="religion"
              value={formData.religion}
              placeholder="Enter religion"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          {/* Birth Date */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Date of Birth</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          {/* Gender */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={style.profileInput}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* State */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>State</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={style.profileInput}
            >
              <option value="">Select State</option>
              {states.map((s, idx) => (
                <option key={idx} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>City</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={style.profileInput}
            >
              <option value="">Select City</option>
              {cities.map((c, idx) => (
                <option key={idx} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Address</label>
            <textarea
              name="address"
              value={formData.address}
              placeholder="Enter your full address"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          {/* Social Media Links */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>
              <FaSquareInstagram /> Instagram
            </label>
            <input
              type="text"
              name="social_instagram"
              value={formData.socialLinks.instagram}
              placeholder="Instagram profile link"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          <div className={style.formGroup}>
            <label className={style.formLabel}>
              <FaXTwitter /> Twitter
            </label>
            <input
              type="text"
              name="social_twitter"
              value={formData.socialLinks.twitter}
              placeholder="Twitter profile link"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          <div className={style.formGroup}>
            <label className={style.formLabel}>
              <FaFacebook /> Facebook
            </label>
            <input
              type="text"
              name="social_facebook"
              value={formData.socialLinks.facebook}
              placeholder="Facebook profile link"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          <div className={style.formGroup}>
            <label className={style.formLabel}>
              <FaLinkedin /> LinkedIn
            </label>
            <input
              type="text"
              name="social_linkedin"
              value={formData.socialLinks.linkedin}
              placeholder="LinkedIn profile link"
              onChange={handleChange}
              className={style.profileInput}
            />
          </div>

          {/* Submit button */}
          <div className={style.formSubmit}>
            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>

        {message && <p className={style.formMessage}>{message}</p>}
      </div>
    </div>
  );
}

export default ProfileSocial;
