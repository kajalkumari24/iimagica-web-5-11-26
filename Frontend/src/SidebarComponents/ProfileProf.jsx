import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaInstagram, FaFacebook, FaLinkedin, FaBars } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import style from "./ProfileProf.module.css";
import { BASE_URL } from "../url";

export default function ProfileProf() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    profiletype: "", // ✅ added profiletype
    name: "",
    partyname: "",
    positionname: "",
    mobile: "",
    email: "", // ✅ prefill email
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
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profileImage, setProfileImage] = useState("/upload.jpeg");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [professionalTypes, setProfessionalTypes] = useState([]);

  // ✅ Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.post(
          "https://countriesnow.space/api/v0.1/countries/states",
          { country: "India" }
        );
        setStates(res.data.data.states.map((s) => s.name));
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };
    fetchStates();
  }, []);

  // ✅ Fetch dynamic professional categories
  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/profile-types/professional`);
        setProfessionalTypes(res.data?.professions || []);
      } catch (error) {
        console.error("Error fetching professions:", error);
      }
    };
    fetchProfessions();
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
        } catch (error) {
          console.error("Error fetching cities:", error);
        }
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [formData.state]);

  // ✅ Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("social_")) {
      const platform = name.split("_")[1];
      setFormData((prev) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [platform]: value },
      }));
    } else {
      // ✅ Always store lowercase for profiletype
      if (name === "profiletype") {
        const lowerValue = value.toLowerCase();
        setFormData((prev) => ({ ...prev, [name]: lowerValue }));

        // ✅ Navigation based on lowercase value
        switch (lowerValue) {
          case "business":
            navigate("/profile-selection/profile-bus");
            break;
          case "political":
            navigate("/profile-selection/profile-form");
            break;
          case "professional":
            navigate("/profile-selection/profile-prof");
            break;
          case "personal":
            navigate("/profile-selection/profile-personal");
            break;
          case "social":
            navigate("/profile-selection/profile-social");
            break;
          default:
            break;
        }
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  // ✅ Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file)); // preview
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  // ✅ Remove Background Function
  const handleRemoveBackground = async () => {
    if (!formData.file) return alert("Please upload an image first!");
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
      alert("Error removing background. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("profiletype", formData.profiletype.toLowerCase());
      data.append("name", formData.name);
      data.append("categories", formData.category);
      data.append("designation", formData.designation);
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
    <div className={style.profMain}>
      {/* Sidebar */}
      <div
        className={style.profSidebar}
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
          <li><Link to="/profile-selection/profile-prof">{isSidebarOpen && "Profile"}</Link></li>
          <li><Link to="/premium">{isSidebarOpen && "My Premium"}</Link></li>
          <li><Link to="/feedback">{isSidebarOpen && "Feedback"}</Link></li>
          <li><Link to="/help">{isSidebarOpen && "Help & Support"}</Link></li>
        </ul>
      </div>

      {/* Profile Form */}
      <div className={style.profContainer}>
        <h2 className={style.formTitle}>Profile</h2>
        <h3 className={style.formSubtitle}>Selected Profile: Professional</h3>

        <form onSubmit={handleSubmit} className={style.profForm}>
          {/* Upload Image */}
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
            <p className={style.uploadText}>Upload Photo</p>

            {formData.file && (
              <button
                type="button"
                className={style.bgRemoveButton}
                onClick={handleRemoveBackground}
                disabled={loading}
              >
                {loading ? "Removing Background..." : "Remove Background"}
              </button>
            )}
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
              <option value="">Select Profile Type</option>
              <option value="business">Business</option>
              <option value="political">Political</option>
              <option value="professional">Professional</option>
              <option value="personal">Personal</option>
              <option value="social">Social Worker</option>
            </select>
          </div>

          {/* Name */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Your Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              className={style.formInput}
            />
          </div>

          {/* Category */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Professional Category</label>
            <select
              name="category"
              value={formData.category || ""}
              onChange={handleChange}
              className={style.formInput}
            >
              <option value="">Select Category</option>
              {professionalTypes.map((type) => (
                <option key={type._id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Designation */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Designation</label>
            <input
              type="text"
              name="Designation"
              placeholder="Designation"
              value={formData.Designation}
              onChange={handleChange}
              className={style.formInput}
            />
          </div>

          {/* Address */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Address</label>
            <textarea
              name="address"
              placeholder="Your Address"
              value={formData.address}
              onChange={handleChange}
              rows="1 "
              className={style.formInput}
            />
          </div>

          {/* Mobile */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Mobile Number</label>
            <input
              type="text"
              name="mobile"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={handleChange}
              className={style.formInput}
            />
          </div>

          {/* Email */}
          <div className={style.formGroup}>
            <label className={style.formLabel}> Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter Business Email"
              value={formData.email}
              onChange={handleChange}
              className={style.formInput}
            />
          </div>

          {/* Language */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Select Language</label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className={style.formInput}
            >
              <option value="">Select Language</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          {/* Religion */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Select Religion</label>
            <select
              name="religion"
              value={formData.religion}
              onChange={handleChange}
              className={style.formInput}
            >
              <option value="">Select Religion</option>
              <option value="Hindu">Hindu</option>
              <option value="Muslim">Muslim</option>
              <option value="Christian">Christian</option>
              <option value="Sikhism">Sikhism</option>
            </select>
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
            <div className={style.genderOptions}>
              {["Male", "Female", "Other"].map((g) => (
                <label key={g} className={style.genderLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={formData.gender === g}
                    onChange={handleChange}
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>

          {/* State */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Select State</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={style.formInput}
            >
              <option value="">Please Select State</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className={style.formGroup}>
            <label className={style.formLabel}>Select City</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={!formData.state}
              className={style.formInput}
            >
              <option value="">Please Select City</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Social Links */}
          {[
            { name: "instagram", icon: <FaInstagram color="#E1306C" /> },
            { name: "twitter", icon: <FaXTwitter color="black" /> },
            { name: "facebook", icon: <FaFacebook color="#1877F2" /> },
            { name: "linkedin", icon: <FaLinkedin color="#0A66C2" /> },
          ].map((social) => (
            <div key={social.name} className={style.formGroup}>
              <label className={style.formLabel}>
                {social.icon}{" "}
                {social.name.charAt(0).toUpperCase() + social.name.slice(1)}
              </label>
              <input
                type="text"
                name={`social_${social.name}`}
                placeholder="Profile Link or Username"
                value={formData.socialLinks[social.name]}
                onChange={handleChange}
                className={style.formInput}
              />
            </div>
          ))}

          {/* Submit */}
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
