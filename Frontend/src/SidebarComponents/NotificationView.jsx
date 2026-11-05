import React, { useState, useEffect,useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./NotificationView.module.css";
import { MdEmail, MdPhone } from "react-icons/md";
import DownloadButton from "./DownloadButton";
import FeedbackModal from "./FeedbackModal";
import { FaInstagram, FaTwitter, FaFacebook, FaLinkedin } from "react-icons/fa";
import { BASE_URL } from "../url";
import { stripCountryCodeForDisplay } from "../utils/phoneDisplay";
// import { BASE_URL } from "./url"; // ✅ Add this line


const dynamicFrames = [
  "/frame1.png",
  "/frame2.png",
  "/frame3.png",
  "/frame4.png",
];

// ✅ Har frame ke liye alag positioning
const frameLayouts = {
  "/frame1.png": {
   photo: { position: "absolute", top: "275px", left: "188px", width: "90px", height: "90px" },
  name: { position: "absolute", top: "370px", left: "80px", color: "#fff", fontWeight:"bold" },
  position: { position: "absolute", top: "400px", left: "6%", color: "#fff", fontWeight:"bold" },
  businessName: { position: "absolute", top: "410px", left: "6%", color: "#fff", fontWeight:"bold" },
  instagram: { position: "absolute", top: "390px", left: "75%", color: "#fff",  },
  twitter: { position: "absolute", top: "0x", left: "75%", color: "#fff",  },
  facebook: { position: "absolute", top: "410px", left: "75%", color: "#fff",  },
  linkedin: { position: "absolute", top: "430px", left: "75%", color: "#fff",  },
  designation: { position: "absolute", top: "560px", left: "80px", color: "#fff", fontWeight:"bold" },
},
  "/frame2.png": {
    photo: { position: "absolute", top: "70px", left: "400px", width: "120px", height: "120px" },
    name: { position: "absolute", top: "200px", left: "400px", color: "#fff", fontWeight: "bold" },
    party: { position: "absolute", top: "240px", left: "400px", color: "#fff" },
    position: { position: "absolute", top: "270px", left: "400px", color: "#fff" },
    businessName: { position: "absolute", top: "300px", left: "400px", color: "#fff" },
    email: { position: "absolute", top: "330px", left: "400px", color: "#fff" },
    phone: { position: "absolute", top: "360px", left: "400px", color: "#fff" },
  },
  "/frame3.png": {
    photo: { position: "absolute", top: "120px", left: "50px", width: "80px", height: "80px" },
    name: { position: "absolute", top: "180px", left: "50px", color: "#fff", fontWeight: "bold" },
    party: { position: "absolute", top: "220px", left: "50px", color: "#fff" },
    position: { position: "absolute", top: "250px", left: "50px", color: "#fff" },
    businessName: { position: "absolute", top: "280px", left: "50px", color: "#fff" },
    email: { position: "absolute", top: "310px", left: "50px", color: "#fff" },
    phone: { position: "absolute", top: "340px", left: "50px", color: "#fff" },
  },
"/frame4.png": {
  photo: { position: "absolute", top: "280px", left: "190px", width: "90px", height: "90px" },
  name: { position: "absolute", top: "370px", left: "80px", color: "#fff", fontWeight:"bold" },
  position: { position: "absolute", top: "400px", left: "6%", color: "#fff", fontWeight:"bold" },
  businessName: { position: "absolute", top: "410px", left: "6%", color: "#fff", fontWeight:"bold" },
  instagram: { position: "absolute", top: "390px", left: "75%", color: "#fff",  },
  twitter: { position: "absolute", top: "0x", left: "75%", color: "#fff",  },
  facebook: { position: "absolute", top: "410px", left: "75%", color: "#fff",  },
  linkedin: { position: "absolute", top: "430px", left: "75%", color: "#fff",  },
  designation: { position: "absolute", top: "560px", left: "80px", color: "#fff", fontWeight:"bold" },
},
};

const NotificationView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedImage, images } = location.state || {};
const captureRef = useRef(); // 👈 download ke liye target
  const [currentImage, setCurrentImage] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [frames, setFrames] = useState([]);
  // const [containerSize, setContainerSize] = useState({ width: 600, height: 469 });
  const [userProfile, setUserProfile] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);

   const [showFeedback, setShowFeedback] = useState(false);

  // jab download complete hoga tab call karna
  const handleDownloadComplete = () => {
    setShowFeedback(true);
  };

 

  // Load frames
  useEffect(() => {
    setFrames(dynamicFrames);
  }, []);

  // Fetch logged-in user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/profiles/me`, {
          credentials: "include",
        });
        const data = await res.json();
        const profile = data.profile || data;

        const subscription = data.subscription;
        if (subscription) {
          if (subscription.subscriptionStatus === "expired") {
            setIsExpired(true);
          } else if (subscription.expiryDate) {
            setExpiryDate(subscription.expiryDate);
          }
        }

        const imageUrl = profile.file ? `${BASE_URL}${profile.file}` : null;

        setUserProfile({
  ...profile,
  fileUrl: imageUrl,
  profileType: profile.profiletype?.toLowerCase(),
  partyName: profile.partyname,
  positionName: profile.positionname,
  mobile: stripCountryCodeForDisplay(profile.mobile),
  email: profile.email,
  instagram: profile.instatext,        // <-- MyProfile field
  twitter: profile.social_twitter,     // <-- MyProfile field
  facebook: profile.social_facebook,   // <-- MyProfile field
  linkedin: profile.social_linkedin,   // <-- MyProfile field
  category: profile.businessName,
  designation: profile.designation,
  name: profile.name,
});

        setCurrentImage(selectedImage || imageUrl);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [selectedImage]);

  // ✅ Escape to go back if expired, or close feedback modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (showFeedback) {
          setShowFeedback(false);
        } else if (isExpired) {
          navigate(-1);
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isExpired, navigate, showFeedback]);

  // Adjust container size according to image aspect ratio
  // Fixed container size
const [containerSize] = useState({ width: 469, height: 469 });

 

  if (!currentImage) return <p className={styles.loading}>Loading image...</p>;

  const handleFeedbackSubmit = async (feedbackText) => {
  try {
    const res = await fetch(`${BASE_URL}/api/feedback/add-feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ feedback: feedbackText }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("✅ Thanks for your feedback!");
      setShowFeedback(false);
    } else {
      alert(data.message || "Failed to submit feedback");
    }
  } catch (err) {
    console.error("Feedback submit error:", err);
  }
};
  
  
  
  return (
    <div className={styles.container}>
      {/* ✅ Expiry Blocker Popup Overlay */}
      {isExpired && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(3, 3, 24, 0.95)", zIndex: 99999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)"
        }}>
          <div style={{
            background: "#111", padding: "40px", borderRadius: "16px",
            border: "1px solid #333", textAlign: "center", maxWidth: "420px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ color: "#ff6b7a", fontSize: "26px", marginBottom: "16px", marginTop: 0 }}>Subscription Expired</h2>
            <p style={{ color: "#ccc", fontSize: "16px", marginBottom: "30px", lineHeight: "1.5" }}>
              Your free trial or premium plan has ended. You no longer have access to select frames or download images. Please upgrade to continue.
            </p>
            <button onClick={() => navigate('/premium')} style={{
              background: "linear-gradient(90deg, #00d4ff, #0088ff)", color: "#000", border: "none", padding: "14px 24px",
              fontSize: "16px", fontWeight: "bold", borderRadius: "8px", cursor: "pointer", width: "100%"
            }}>
              View Premium Plans
            </button>
            <button onClick={() => navigate(-1)} style={{
              background: "transparent", color: "#888", border: "1px solid #444", padding: "10px 24px", 
              fontSize: "14px", borderRadius: "8px", cursor: "pointer", width: "100%", marginTop: "12px"
            }}>
              Go Back
            </button>
          </div>
        </div>
      )}
      <div className={styles.content}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ⬅ Back
          </button>

          <h3>Frames</h3>
          <div className={styles.frameGrid}>
            {frames.map((frame, index) => (
              <div
                key={index}
                className={styles.frameBox}
                onClick={() => setSelectedFrame(frame)}
              >
                <img
                  src={frame}
                  alt={`Frame ${index}`}
                  className={styles.frameThumb}
                />
              </div>
            ))}
          </div>

       {/* ✅ Download Button + Feedback trigger */}
          <DownloadButton targetRef={captureRef} onDownload={handleDownloadComplete} />
        </div>

        {/* Main image + frame + overlay */}
        <div className={styles.mainSection}>
          <div
            ref={captureRef}  // 👈 Jis container ko download karna hai usme ref lagao
            className={styles.imageWrapper}
            style={{ width: containerSize.width, height: containerSize.height }}
          >
            {/* Uploaded base image */}
      <img
  src={currentImage}
  alt="Uploaded"
  className={styles.baseImage}
  style={{ width: containerSize.width, height: containerSize.height }}
/>

{/* Frame overlay */}
{selectedFrame && (
  <img
    src={selectedFrame}
    alt="Frame"
    className={styles.frameOverlay}
    style={{ width: containerSize.width, height: containerSize.height }}
  />
)}

{/* User profile overlay */}
{userProfile && selectedFrame && (
  <>
    {/* User photo */}
    {userProfile.fileUrl && (
      <img
        src={userProfile.fileUrl}
        alt={userProfile.name}
        className={styles.userPhoto}
        style={frameLayouts[selectedFrame]?.photo}
      />
    )}

    {/* User name */}
    {userProfile.name && (
      <p className={styles.userName} style={frameLayouts[selectedFrame]?.name}>
        {userProfile.name}
      </p>
    )}

  
    {/* ✅ Position Name */}
    {userProfile.positionName && (
      <p className={styles.userPosition} style={frameLayouts[selectedFrame]?.position}>
        {userProfile.positionName}
      </p>
    )}


{/* Email */}
{userProfile.email && (
  <p className={styles.userBusiness} style={frameLayouts[selectedFrame]?.email}>
    {userProfile.email}
  </p>
)}

{/* Phone */}
{userProfile.mobile && (
  <p className={styles.userBusiness} style={frameLayouts[selectedFrame]?.phone}>
    {userProfile.mobile}
  </p>
)}
{/* Instagram */}
{userProfile.instagram && (
  <div
    className={styles.userSocial}
    style={frameLayouts[selectedFrame]?.instagram}
  >
    <FaInstagram style={{ marginRight: "6px" }} />
    <span>{userProfile.instagram}</span>
  </div>
)}

{/* Twitter */}
{userProfile.twitter && (
  <div
    className={styles.userSocial}
    style={frameLayouts[selectedFrame]?.twitter}
  >
    <FaTwitter style={{ marginRight: "6px" }} />
    <span>{userProfile.twitter}</span>
  </div>
)}

{/* Facebook */}
{userProfile.facebook && (
  <div
    className={styles.userSocial}
    style={frameLayouts[selectedFrame]?.facebook}
  >
    <FaFacebook style={{ marginRight: "6px" }} />
    <span>{userProfile.facebook}</span>
  </div>
)}

{/* LinkedIn */}
{userProfile.linkedin && (
  <div
    className={styles.userSocial}
    style={frameLayouts[selectedFrame]?.linkedin}
  >
    <FaLinkedin style={{ marginRight: "6px" }} />
    <span>{userProfile.linkedin}</span>
  </div>
)}

{/* Designation */}
{userProfile.designation && (
  <p className={styles.userDesignation} style={frameLayouts[selectedFrame]?.designation}>
    {userProfile.designation}
  </p>
)}

{/* //for bussiness */}

  {/* Show only for business profile */}
    {userProfile.profileType === "business" && (
      <>
        {userProfile.name && (
          <p className={styles.userName} style={frameLayouts[selectedFrame]?.name}>
            {userProfile.name}
          </p>
        )}

        {userProfile.businessName && (
          <p className={styles.userBusiness} style={frameLayouts[selectedFrame]?.businessName}>
            {userProfile.businessName}
          </p>
        )}
      </>
    )}
  

                {/* Extra info */}
                <div style={frameLayouts[selectedFrame]?.extraInfo}>
                  {(userProfile.profileType === "political" ||
                    userProfile.profileType === "social worker") && (
                    <>
                      {userProfile.partyName && (
                        <p className={styles.userParty}> {userProfile.partyName}</p>
                      )}
                      {userProfile.positionName && (
                        <p className={styles.userPosition}> {userProfile.positionName}</p>
                      )}
                    </>
                  )}

                  {(userProfile.profileType === "personal" ||
                    userProfile.profileType === "business") && (
                    <>
                      {userProfile.mobile && (
                        <p className={styles.userBusiness}>
                          <MdPhone style={{ marginRight: "6px" }} />
                          {userProfile.mobile}
                        </p>
                      )}
                      {userProfile.email && (
                        <p className={styles.userBusiness}>
                          <MdEmail style={{ marginRight: "6px" }} />
                          {userProfile.email}
                        </p>
                      )}
                    </>
                  )}

                  {userProfile.profileType === "professional" && (
                    <>
                      {userProfile.category && (
                        <p className={styles.userParty}> {userProfile.category}</p>
                      )}
                      {userProfile.designation && (
                        <p className={styles.userPosition}> {userProfile.designation}</p>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Other uploaded images */}
          {images && images.length > 0 && (
            <div className={styles.otherImages}>
              {images
                .filter((img) => img.url !== currentImage)
                .map((img, index) => (
                  <img
                    key={index}
                    src={img.url}
                    alt={`Other ${index}`}
                    className={styles.thumb}
                    onClick={() => setCurrentImage(img.url)}
                  />
                ))}
            </div>
          )}
        </div>
       {/* ✅ Feedback Modal */}
        <FeedbackModal
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
          onSubmit={handleFeedbackSubmit}
        />
      </div>
    </div>
  );
};

export default NotificationView;
