import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./ProfileSelection.module.css";
import { BASE_URL } from "./url";

// Renders profile selection either as a full page or as a centered modal

const profiles = [
  { name: "Business", icon: "business.png", route: "profile-bus" },
  { name: "Political", icon: "/political.jpg", route: "profile-form" },
  { name: "Professional", icon: "/professional.jpg", route: "profile-prof" },
  { name: "Personal", icon: "/personal.jpg", route: "profile-personal" },
  { name: "Social Workers", icon: "/social.jpg", route: "profile-social" },
];

export default function ProfileSelection() {
  const navigate = useNavigate();
const location = useLocation();
  const email = location.state?.email;
  const isModal = location.state?.modal === true || new URLSearchParams(location.search).get('modal') === '1';

  // If this route is opened directly (not as a modal), redirect to the canonical
  // sub-route where we already render selection (`/profile-selection/profile-bus`).
  // This removes the full-page version while preserving email state.
  React.useEffect(() => {
    if (!isModal) {
      // When visiting the selection route directly, redirect to consolidated profile page
      navigate(`/myprofile`, { state: { email }, replace: true });
    }
  }, [isModal, navigate, email]);
  const handleProfileClick = (profileName) => {
    // If opened as a modal, navigate inside the modal path preserving modal flag
    // Open the consolidated profile form and pass the selected profile
    navigate(`/myprofile`, { state: { selectedProfile: profileName, modal: isModal, email: location.state?.email } });
  };

  // If modal mode, render a dialog overlay that can be closed (goBack)
  if (isModal) {
    // if opened as a modal, check whether the user already has a profile
    // and skip the modal if so (improves UX for returning users)
    React.useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const res = await fetch(`${BASE_URL}/api/profiles/me`, {
            credentials: "include",
          });
          if (!mounted) return;
          if (res.ok) {
            // user already has a profile — close modal and go home
            navigate("/home");
          }
        } catch (err) {
          // ignore — leave modal open
          console.debug("profile check failed", err);
        }
      })();
      return () => (mounted = false);
    }, [navigate]);
    return (
      <div className={styles.modalBackdrop} onClick={() => navigate(-1)}>
        <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Select Profile</h3>
            <div style={{display:'flex',gap:8}}>
              <button className={styles.skipBtn} onClick={() => navigate('/home')}>Skip</button>
              <button className={styles.closeBtn} onClick={() => navigate(-1)}>✖</button>
            </div>
          </div>
          <div className={styles.profilegrid}>
            {profiles.map((profile, index) => (
              <div
                className={styles.profilecard}
                key={index}
                onClick={() => handleProfileClick(profile.route)}
              >
                <img src={profile.icon} alt={profile.name} className={styles.profileicon} />
                <div className={styles.profilename}>{profile.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 🔹 Background Video */}
      <video autoPlay muted loop className={styles.backgroundVideo}>
        <source src="/backgrouond2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 🔹 Content */}
      <div className={styles.overlay}>
        <div className={styles.profileheader}>
          <h2>Select Profile</h2>
          <p>Choose the Profile</p>
        </div>

        <div className={styles.profilegrid}>
          {profiles.map((profile, index) => (
            <div
              className={styles.profilecard}
              key={index}
              onClick={() => handleProfileClick(profile.route)}
            >
              <img src={profile.icon} alt={profile.name} className={styles.profileicon} />
              <div className={styles.profilename}>{profile.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
