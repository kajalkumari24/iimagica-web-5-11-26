import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaInstagram, FaFacebook, FaLinkedin, FaBars } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import style from "./ProfilePersonal.module.css";
import { BASE_URL } from "../url";

export default function ProfilePersonal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [formData, setFormData] = useState({
    profiletype: "personal",
    name: "",
    mobile: "",
    email: "",
    language: "",
    religion: "",
    birthDate: "",
    gender: "",
    state: "",
    city: "",
    address: "",
    category: "",
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
  const [categories, setCategories] = useState([
    "Student",
    "Housewife",
    "YouTuber",
    "Other",
  ]);

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

  // ✅ Handle change
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("social_")) {
      const platform = name.split("_")[1];
      setFormData((prev) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [platform]: value },
      }));
    } else if (name === "category" && value === "other") {
      const customCategory = prompt("Enter your Category:");
      if (customCategory && customCategory.trim() !== "") {
        setFormData((prev) => ({ ...prev, category: customCategory }));
        setCategories((prev) => [
          ...prev.filter((c) => c !== "other"),
          customCategory,
          "other",
        ]);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // ✅ Navigate when profileType changes
      if (name === "profiletype") {
        switch (value) {
          case "Business":
            navigate("/profile-selection/profile-bus");
            break;
          case "Political":
            navigate("/profile-selection/profile-form");
            break;
          case "Professional":
            navigate("/profile-selection/profile-prof");
            break;
          case "Personal":
            navigate("/profile-selection/profile-personal");
            break;
          case "Social Worker":
            navigate("/profile-selection/profile-social");
            break;
          default:
            break;
        }
      }
    }
  };

  // ✅ Background removal function
  const removeBackground = async () => {
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

  // ✅ Upload handler


  // ✅ Image upload (auto remove background)
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, file }));
    await removeBackground(file); // 👈 automatically remove background after upload
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("profiletype", formData.profiletype);
      data.append("name", formData.name);
      data.append("categories", formData.category);
      data.append("mobile", formData.mobile);
      data.append("email", formData.email);
      data.append("language", formData.language);
      data.append("religion", formData.religion);
      data.append("birthDate", formData.birthDate);
      data.append("gender", formData.gender);
      data.append("state", formData.state);
      data.append("city", formData.city);
      data.append("address", formData.address);
      data.append("social_instagram", formData.socialLinks.instagram);
      data.append("social_twitter", formData.socialLinks.twitter);
      data.append("social_facebook", formData.socialLinks.facebook);
      data.append("social_linkedin", formData.socialLinks.linkedin);
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
    <div className={style.personalMain}>
      {/* Sidebar */}
      <div
        className={style.personalSidebar}
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
          <li><Link to="/profile-selection/profile-personal">{isSidebarOpen && "Profile"}</Link></li>
          <li><Link to="/premium">{isSidebarOpen && "My Premium"}</Link></li>
          <li><Link to="/feedback">{isSidebarOpen && "Feedback"}</Link></li>
          <li><Link to="/help">{isSidebarOpen && "Help & Support"}</Link></li>
        </ul>
      </div>

      {/* Form Section */}
      <div className={style.personalContainer}>
        <h2 className={style.formTitle}>Profile</h2>
        <h3 className={style.formSubtitle}>
          Selected Profile: {formData.profiletype}
        </h3>

        <form onSubmit={handleSubmit} className={style.personalForm}>
          {/* Upload */}
          <div className={style.uploadContainer}>
            <label htmlFor="imageUpload" className={style.uploadBox}>
              <img src={profileImage} alt="Upload" className={style.uploadImg} />
            </label>

            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              className={style.hiddenInput}
              onChange={handleImageChange}
            />

            <div className={style.buttonGroup}>
              <button
                type="button"
                onClick={removeBackground}
                className={style.removeBgBtn}
                disabled={loading}
              >
                {loading ? "Removing..." : "Remove Background"}
              </button>
            </div>
          </div>

          {/* Profile Type */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Profile Type</label>
            <select
              name="profiletype"
              value={formData.profiletype}
              onChange={handleChange}
              className={style.formInput}
            >
              <option value="">Profile Type</option>
              <option value="Business">business</option>
              <option value="Political">political</option>
              <option value="Professional">professional</option>
              <option value="personal">personal</option>
              <option value="Social Worker">social</option>
            </select>
          </div>

          {/* Name */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Your Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              className={style.formInput}
            />
          </div>

          {/* Category */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={style.formInput}
            >
              <option value="">Select Category</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
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
              onChange={handleChange}
              className={style.formInput}
              rows="1"
            />
          </div>

          {/* Mobile */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Mobile</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Enter mobile"
              className={style.formInput}
            />
          </div>

          {/* Email */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              className={style.formInput}
            />
          </div>

          {/* Language */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Language</label>
            <input
              type="text"
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder="Enter language"
              className={style.formInput}
            />
          </div>

          {/* Religion */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Religion</label>
            <input
              type="text"
              name="religion"
              value={formData.religion}
              onChange={handleChange}
              placeholder="Enter religion"
              className={style.formInput}
            />
          </div>

          {/* Birth Date */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Birth Date</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className={style.formInput}
            />
          </div>

          {/* Gender */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={style.formInput}
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
              className={style.formInput}
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
              className={style.formInput}
              disabled={!formData.state}
            >
              <option value="">Select City</option>
              {cities.map((c, idx) => (
                <option key={idx} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Social Links */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>
              <FaInstagram /> Instagram
            </label>
            <input
              type="text"
              name="social_instagram"
              value={formData.socialLinks.instagram}
              onChange={handleChange}
              className={style.formInput}
              placeholder="Instagram link"
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
              onChange={handleChange}
              className={style.formInput}
              placeholder="Twitter link"
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
              onChange={handleChange}
              className={style.formInput}
              placeholder="Facebook link"
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
              onChange={handleChange}
              className={style.formInput}
              placeholder="LinkedIn link"
            />
          </div>

          {/* Submit */}
          {/* ✅ Submit Button Fixed */}
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
