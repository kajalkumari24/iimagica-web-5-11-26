import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import style from "./ProfileBussi.module.css";
import { FaBars } from "react-icons/fa";
import { BASE_URL } from "../url";

export default function ProfileBussi() {
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profileImage, setProfileImage] = useState("/upload.jpeg");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    profiletype: "",
    category: "",
    businessName: "",
    businessTagline: "",
    mobile: "",
    email: "",
    website: "",
    language: "",
    religion: "",
    birthDate: "",
    gender: "",
    state: "",
    city: "",
    socialLinks: { instagram: "", twitter: "", facebook: "", linkedin: "" },
    file: null,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/categories`);
        setCategories(res.data || []);
      } catch (err) {
        setCategories(["Restaurant", "IT Services", "Fashion & Clothing", "Education", "Healthcare", "Real Estate", "Finance", "Travel & Tourism", "Electronics", "Automobile", "other"]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.post("https://countriesnow.space/api/v0.1/countries/states", { country: "India" });
        setStates(res.data?.data?.states?.map((s) => s.name) || []);
      } catch (_) {
        setStates([]);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.state) return setCities([]);
      try {
        const res = await axios.post("https://countriesnow.space/api/v0.1/countries/state/cities", { country: "India", state: formData.state });
        setCities(res.data?.data || []);
      } catch (_) {
        setCities([]);
      }
    };
    fetchCities();
  }, [formData.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("social_")) {
      const platform = name.split("_")[1];
      setFormData((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [platform]: value } }));
      return;
    }
    if (name === "category" && value === "other") {
      const custom = prompt("Enter your Business Category:");
      if (custom && custom.trim()) {
        setFormData((prev) => ({ ...prev, category: custom }));
        setCategories((prev) => [...prev.filter((c) => c !== "other"), custom, "other"]);
      }
      return;
    }
    if (name === "profiletype") {
      const lower = String(value).toLowerCase();
      setFormData((prev) => ({ ...prev, profiletype: lower }));
      switch (lower) {
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
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleRemoveBackground = async () => {
    if (!formData.file) return alert("Please upload an image first!");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", formData.file);
      const res = await axios.post(`${BASE_URL}/api/images/remove-bg`, fd, { withCredentials: true });
      if (res?.data?.fileUrl) {
        const fileUrl = res.data.fileUrl;
        const fetched = await fetch(fileUrl);
        const blob = await fetched.blob();
        const newFile = new File([blob], formData.file.name, { type: "image/png" });
        setProfileImage(fileUrl);
        setFormData((prev) => ({ ...prev, file: newFile }));
      } else {
        throw new Error("remove-bg returned no fileUrl");
      }
    } catch (err) {
      console.error(err);
      alert("Background removal failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = new FormData();
      data.append("profiletype", (formData.profiletype || "").toLowerCase());
      data.append("name", formData.name || "");
      data.append("categories", formData.category || "");
      data.append("businessName", formData.businessName || "");
      data.append("businessTagline", formData.businessTagline || "");
      data.append("mobile", formData.mobile || "");
      data.append("email", formData.email || "");
      data.append("website", formData.website || "");
      data.append("language", formData.language || "");
      data.append("religion", formData.religion || "");
      data.append("birthDate", formData.birthDate || "");
      data.append("gender", formData.gender || "");
      data.append("state", formData.state || "");
      data.append("city", formData.city || "");

      data.append("social_instagram", formData.socialLinks.instagram || "");
      data.append("social_twitter", formData.socialLinks.twitter || "");
      data.append("social_facebook", formData.socialLinks.facebook || "");
      data.append("social_linkedin", formData.socialLinks.linkedin || "");

      if (formData.file) data.append("file", formData.file);

      await axios.post(`${BASE_URL}/api/profiles`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setMessage("Profile submitted successfully!");
      navigate("/home");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={style.bussimain}>
      <div className={style.sidebar} style={{ width: isSidebarOpen ? "250px" : "60px" }}>
        <div className={style.collapseButton} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <FaBars />
        </div>
        <h2 className={style.sidebarTitle} style={{ display: isSidebarOpen ? "block" : "none" }}>
          Menu
        </h2>
        <ul className={style.sidebarList}>
          <li className={location.pathname === "/profile-selection/profile-form" ? style.active : ""}>
            <Link to="/profile-selection/profile-form">{isSidebarOpen && "Profile"}</Link>
          </li>
          <li className={location.pathname === "/premium" ? style.active : ""}>
            <Link to="/premium">{isSidebarOpen && "My Premium"}</Link>
          </li>
          <li className={location.pathname === "/help" ? style.active : ""}>
            <Link to="/help">{isSidebarOpen && "Help & Support"}</Link>
          </li>
        </ul>
      </div>

      <div className={style.bussicontainer}>
        <h2 className={style.bussiformtitle}>Profile</h2>
        <h3 className={style.bussiformsubtitle}>Selected Profile: Business</h3>

        <form onSubmit={handleSubmit} className={style.bussiform}>
          <div className={style.bussiupload}>
            <label htmlFor="imageUpload" className={style.bussiuploadbox}>
              <img src={profileImage} alt="Upload" className={style.bussiuploadimg} />
            </label>
            <input id="imageUpload" type="file" accept="image/*" className={style.bussihidden} onChange={handleImageChange} />
            <p className={style.bussiuploadtext}>Upload Photo/Logo</p>
            {formData.file && (
              <button type="button" className={style.bgRemoveButton} onClick={handleRemoveBackground} disabled={loading}>
                {loading ? "Removing Background..." : "Remove Background"}
              </button>
            )}
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>Profile Type</label>
            <select name="profiletype" value={formData.profiletype} onChange={handleChange} className={style.profileinput}>
              <option value="">Profile Type</option>
              <option value="business">Business</option>
              <option value="political">Political</option>
              <option value="professional">Professional</option>
              <option value="personal">Personal</option>
              <option value="social">Social</option>
            </select>
          </div>

          <div className={style.bussigroup}>
            <label className={style.bussilabel}>Your Name</label>
            <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className={style.bussiinput} />
          </div>

          <div className={style.bussigroup}>
            <label className={style.bussilabel}>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className={style.bussiinput}>
              <option value="">Select Category</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className={style.bussigroup}>
            <label className={style.bussilabel}>Business Name</label>
            <input type="text" name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} className={style.bussiinput} />
          </div>

          <div className={style.bussigroup}>
            <label className={style.bussilabel}>Business Tagline</label>
            <input type="text" name="businessTagline" placeholder="Business Tagline" value={formData.businessTagline} onChange={handleChange} className={style.bussiinput} />
          </div>

          <div className={style.bussigroup}>
            <label className={style.bussilabel}>Address</label>
            <textarea name="address" placeholder="Your Address" value={formData.address} onChange={handleChange} rows="1" className={style.bussiinput} />
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>Mobile Number</label>
            <input type="text" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} className={style.profileinput} />
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>Business Email</label>
            <input type="email" name="email" placeholder="Enter Business Email" value={formData.email} onChange={handleChange} className={style.profileinput} />
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>Business Website</label>
            <input type="text" name="website" placeholder="Enter Business Website" value={formData.website} onChange={handleChange} className={style.profileinput} />
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>Select Language</label>
            <select name="language" value={formData.language} onChange={handleChange} className={style.profileinput}>
              <option value="">Select Language</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>Select Religion</label>
            <select name="religion" value={formData.religion} onChange={handleChange} className={style.profileinput}>
              <option value="">Select Religion</option>
              <option value="Hindu">Hindu</option>
              <option value="Muslim">Muslim</option>
              <option value="Christian">Christian</option>
              <option value="Sikhism">Sikhism</option>
            </select>
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>Birth Date</label>
            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className={style.profileinput} />
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>Gender</label>
            <div className={style.genderOptions}>
              {["Male", "Female", "Other"].map((g) => (
                <label key={g} className={style.genderLabel}>
                  <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleChange} />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>Select State</label>
            <select name="state" value={formData.state} onChange={handleChange} className={style.profileinput}>
              <option value="">Please Select State</option>
              {states.map((s, i) => (
                <option key={i} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>Select City</label>
            <select name="city" value={formData.city} onChange={handleChange} disabled={!formData.state} className={style.profileinput}>
              <option value="">Please Select City</option>
              {cities.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>
              <FaInstagram color="#E1306C" /> Instagram
            </label>
            <input type="text" name="social_instagram" placeholder="Profile Link or Username" value={formData.socialLinks.instagram} onChange={handleChange} className={style.profileinput} />
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>
              <FaXTwitter color="black" /> Twitter
            </label>
            <input type="text" name="social_twitter" placeholder="Profile Link or Username" value={formData.socialLinks.twitter} onChange={handleChange} className={style.profileinput} />
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>
              <FaFacebook color="#1877F2" /> Facebook
            </label>
            <input type="text" name="social_facebook" placeholder="Profile Link or Username" value={formData.socialLinks.facebook} onChange={handleChange} className={style.profileinput} />
          </div>

          <div className={style.formgroup}>
            <label className={style.formlabel}>
              <FaLinkedin color="#0A66C2" /> LinkedIn
            </label>
            <input type="text" name="social_linkedin" placeholder="Profile Link or Username" value={formData.socialLinks.linkedin} onChange={handleChange} className={style.profileinput} />
          </div>

          <div className={style.bussisubmit}>
            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>

        {message && <p className={style.bussimessage}>{message}</p>}
      </div>
    </div>
  );
}
