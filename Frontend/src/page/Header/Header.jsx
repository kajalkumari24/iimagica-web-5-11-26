import React, { useEffect, useRef, useState } from "react";
import { FaCrown, FaBars, FaTimes, FaChevronDown, FaUserCircle, FaBell, FaSearch } from "react-icons/fa";
import NotificationPopup from "../../components/NotificationPopup";
import { Link, useNavigate } from "react-router-dom";
import imm4Logo from "../../assets/iimagicanew.png";
import { BASE_URL } from "../../url";
import { clearAuthToken, getAuthToken } from "../../utils/auth";
import { clearSessionAppState } from "../../utils/appState";
import { ensureUserSession } from "../../utils/sessionAuth";
import socket from "../../socket";

const styles = {
  header: "fixed top-0 left-0 right-0 z-[1000] flex h-16 md:h-20 w-full items-center border-b border-indigo-200/50 bg-white/95 p-0 text-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.05)] backdrop-blur-[20px] transition-all duration-300",
  headercontainer: "mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 md:gap-5",
  logo: "cursor-pointer",
  logoimg: "h-[48px] md:h-[64px] w-auto max-w-[280px] object-contain ml-2 md:ml-5",
  menu: "hidden items-center gap-3 md:flex md:gap-4 lg:text-[18px]",
  searchContainer: "group relative flex w-[280px] md:w-[320px] lg:w-[500px] items-center rounded-[50px] border-2 border-indigo-200/20 bg-gray-100 px-4 py-1.5 transition-all duration-300 focus-within:-translate-y-[2px] focus-within:scale-[1.01] focus-within:border-[#F11C6B] focus-within:bg-white focus-within:shadow-[0_8px_30px_rgba(241,28,107,0.15)]",
  searchIcon: "mr-2 text-[16px] md:text-[20px] text-gray-400 transition-colors duration-300 group-focus-within:text-[#F11C6B]",
  searchInput: "flex-1 bg-transparent py-1.5 text-[14px] md:text-[17px] font-medium text-gray-800 outline-none placeholder-gray-400",
  clearBtn: "ml-2 flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500 transition-all duration-300 hover:rotate-90 hover:bg-gray-300 hover:text-gray-800 cursor-pointer border-none",
  menubtn: "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors hover:bg-gray-100 text-gray-800 cursor-pointer",
  crownicon: "text-yellow-500",
  notifWrap: "relative inline-flex items-center",
  notifBtnContainer: "inline-flex items-center",
  notifBtn: "relative inline-flex items-center justify-center rounded-lg p-1.5 text-[18px] hover:bg-gray-100 text-gray-800 cursor-pointer border-none bg-transparent",
  notifBadge: "absolute right-[2px] top-[2px] z-[3000] inline-flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-[14px] text-white shadow-sm",
  account: "relative",
  accountbtn: "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[16px] md:text-[18px] font-medium transition-colors hover:bg-gray-100 text-gray-800 cursor-pointer border-none bg-transparent",
  dropdownicon: "text-[14px]",
  dropdownmenu: "absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] z-[1000]",
  dropdownHeader: "flex items-center gap-3 rounded-t-2xl border-b border-gray-100 bg-white px-4 py-4",
  avatarImg: "h-11 w-11 rounded-full object-cover",
  avatarInitials: "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-[14px] font-bold text-white",
  avatar: "text-[40px] text-gray-400",
  dropdownHeaderInfo: "flex flex-col",
  username: "text-[15px] font-bold text-gray-900",
  userSub: "mt-0.5 text-[12px] text-gray-500",
  dropdownList: "flex flex-col py-2",
  dropdownitem: "block w-full px-5 py-3 text-left text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 bg-transparent border-none cursor-pointer",
  dropdownFooter: "flex justify-center border-t border-gray-100 px-3.5 pb-3.5 pt-3",
  logoutBtn: "w-full rounded-lg bg-gradient-to-r from-[#F10D64] to-[#F56930] hover:opacity-90 px-2.5 py-2.5 text-[15px] font-bold tracking-[0.3px] text-white transition-all hover:-translate-y-[2px] hover:opacity-90  cursor-pointer border-none",
  mobiletoggle: "inline-flex items-center justify-center p-2 text-[18px] text-gray-800 md:hidden bg-transparent border-none cursor-pointer",
  mobilemenu: "absolute left-0 right-0 top-full z-40 flex flex-col gap-3 bg-white/95 backdrop-blur-md px-6 py-6 shadow-2xl border-b border-gray-200",
  mobilelink: "block rounded-md px-4 py-3 text-[16px] font-medium text-gray-800 transition-colors hover:bg-gray-100",
  mobileaccount: "mt-3 flex flex-col gap-2 pt-4 border-t border-gray-100",
  mobileaccountheading: "mb-1 mt-1 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider",
};

function Header({ searchQuery, setSearchQuery, showHeaderSearch = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [liveTime, setLiveTime] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/api/users/delete-account`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      if (res.ok) {
        clearAuthToken();
        clearSessionAppState();
        closeMenus();
        window.location.href = "/";
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete account. Please try again.");
      }
    } catch (err) {
      console.error("Delete account failed:", err);
      alert("Failed to delete account due to a network error.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // ✅ Close dropdowns & menus on ESC key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setAccountOpen(false);
        setShowNotifications(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const isSessionValid = await ensureUserSession();
        if (!isSessionValid) {
          clearAuthToken();
          setProfileData(null);
          setIsAuth(false);
          return;
        }
        setIsAuth(true);

        const token = getAuthToken();
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        let fetchedData = null;
        try {
          const res = await fetch(`${BASE_URL}/api/profiles/me`, {
            credentials: "include",
            headers,
          });

          if (res.ok) {
            const data = await res.json();
            const profile = data.profile || data.data || data;
            const user = data.user || {};
            fetchedData = {
              ...profile,
              name: profile.name || user.name,
              email: profile.email || user.email,
            };
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        }

        // Fallback to fetch user details if profile doesn't exist or is missing name
        if (!fetchedData || !fetchedData.name) {
          try {
            const userRes = await fetch(`${BASE_URL}/api/users/me`, {
              credentials: "include",
              headers,
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              const user = userData.user || userData.data || userData;
              fetchedData = {
                ...(fetchedData || {}),
                name: fetchedData?.name || user.name,
                email: fetchedData?.email || user.email,
              };
            }
          } catch (userErr) {
            console.error("Error loading user:", userErr);
          }
        }

        setProfileData(fetchedData || {});
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    let mounted = true;
    const fetchSub = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/subscriptions/me`, {
          credentials: "include",
        });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) {
            setSubscription(data.subscription);
          }
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      }
    };
    fetchSub();

    // 🟢 Listen for real-time subscription updates via socket
    const handleSubUpdate = () => {
      if (mounted) fetchSub();
    };
    socket.on('subscriptionUpdated', handleSubUpdate);

    return () => {
      mounted = false;
      socket.off('subscriptionUpdated', handleSubUpdate);
    };
  }, [isAuth]);

  useEffect(() => {
    if (!subscription || !subscription.expiryDate) return;
    const calculateTime = () => {
      const diffMs = new Date(subscription.expiryDate).getTime() - new Date().getTime();
      if (diffMs <= 0) {
        setLiveTime({ expired: true });
      } else {
        setLiveTime({
          days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diffMs % (1000 * 60)) / 1000),
          expired: false
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000); // 🟢 update every second
    return () => clearInterval(timer);
  }, [subscription]);

  useEffect(() => {
    if (!isAuth || !profileData) return;

    let mounted = true;

    const loadNotifications = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/notifications`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });

        if (!mounted || !res.ok) {
          setNotifCount(0);
          return;
        }

        const data = await res.json();
        const readIds = JSON.parse(localStorage.getItem("imagica_read_notifications_v1") || "[]");

        const userProfileType = String(profileData?.profiletype || profileData?.profileType || "").toLowerCase();
        const getUserCategory = () => {
          if (userProfileType === 'political') return String(profileData?.partyname || "").toLowerCase();
          if (userProfileType === 'professional') return String(profileData?.categories || "").toLowerCase();
          if (userProfileType === 'brand') return String(profileData?.brandName || "").toLowerCase();
          return "";
        };
        const userCategory = getUserCategory();

        const filteredData = (data || []).filter((note) => {
          const targetType = String(note.targetProfileType || 'global').toLowerCase();
          if (targetType === 'all' || targetType === 'global') return true;
          if (targetType !== userProfileType) return false;

          const noteCategory = String(note.category || "").toLowerCase().trim();
          if (noteCategory && userCategory && !userCategory.includes(noteCategory)) return false;
          return true;
        });

        const unreadCount = filteredData.filter((item) => !readIds.includes(item._id)).length;
        setNotifCount(unreadCount);
      } catch (error) {
        setNotifCount(0);
      }
    };

    loadNotifications();

    const handleSocketUpdate = () => {
      if (mounted) loadNotifications();
    };
    socket.on('notificationUpdated', handleSocketUpdate);

    return () => {
      mounted = false;
      socket.off('notificationUpdated', handleSocketUpdate);
    };
  }, [isAuth, profileData]);

  // 🟢 Emit User Online Status via Socket
  useEffect(() => {
    if (isAuth && profileData) {
      const userId = profileData.userId?._id || profileData.userId || profileData.user || profileData._id;
      if (userId) socket.emit("user_online", userId);
    }
  }, [isAuth, profileData]);

  const getInitials = (str) => {
    if (!str) return "U";
    const parts = String(str).trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const closeMenus = () => {
    setMobileOpen(false);
    setAccountOpen(false);
    sessionStorage.removeItem("homeScrollY");
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      clearAuthToken();
      clearSessionAppState();
      closeMenus();
      window.location.href = "/";
    }
  };

  const getSubscriptionText = () => {
    if (!subscription || !subscription.expiryDate) return "Upgrade";
    if (!liveTime) return "Checking...";
    if (liveTime.expired) return "Expired";
    if (liveTime.days === 0) {
      return `${liveTime.hours}h ${liveTime.minutes}m ${liveTime.seconds}s left`;
    }
    return `${liveTime.days} day${liveTime.days !== 1 ? 's' : ''} left`;
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headercontainer}>
          <div
            className={styles.logo}
            onClick={() => {
              sessionStorage.setItem("bypassRedirect", "true");
              window.location.replace("/");
              closeMenus();
            }}
          >
            <img
              className="h-12 w-[70px] md:h-[72px] md:w-[100px] object-cover"
              src={imm4Logo}
              alt="Imagica Logo"
            />
          </div>

          <nav className={styles.menu}>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery || ""}
                onChange={(event) => setSearchQuery?.(event.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery?.("")}
                  className={styles.clearBtn}
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {isAuth && (
              <Link
                to="/subscription"
                className="mx-2 flex items-center whitespace-nowrap rounded-md bg-gradient-to-r from-[#F10D64] to-[#F56930] px-3 py-2 text-[13px] font-bold text-[rgb(255,255,255)] transition-all hover:opacity-90"
                onClick={closeMenus}
              >
                <FaCrown className="mr-1.5 text-[14px]" />
                {getSubscriptionText()}
              </Link>
            )}

            <Link to="/pricing" className={styles.menubtn} onClick={closeMenus}>
              <FaCrown className={styles.crownicon} />
            </Link>

            <div className={styles.notifWrap}>
              <div className={styles.notifBtnContainer}>
                <button type="button" className={styles.notifBtn} onClick={() => setShowNotifications((v) => !v)} aria-expanded={showNotifications} aria-label="Notifications">
                  <FaBell />
                  {notifCount > 0 && <span className={styles.notifBadge}>{notifCount}</span>}
                </button>
              </div>
              {showNotifications && (
                <NotificationPopup
                  onClose={() => setShowNotifications(false)}
                  profileData={profileData}
                  onUpdateCount={setNotifCount}
                />
              )}
            </div>

            <div className={styles.account} ref={accountRef}>
              <button
                type="button"
                className={styles.accountbtn}
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
              >
                Account <FaChevronDown className={styles.dropdownicon} />
              </button>

              {accountOpen && (
                <div className={styles.dropdownmenu} role="menu">
                  <div className={styles.dropdownHeader}>
                    {profileData && (profileData.file || profileData.fileUrl) ? (
                      (() => {
                        const raw = profileData.file || profileData.fileUrl;
                        const src = String(raw).startsWith("http") ? raw : `${BASE_URL}${raw}`;
                        return (
                          <img
                            src={src}
                            alt={profileData.name || profileData.email || "Avatar"}
                            className={styles.avatarImg}
                          />
                        );
                      })()
                    ) : profileData && profileData.name ? (
                      <div className={styles.avatarInitials}>{getInitials(profileData.name)}</div>
                    ) : (
                      <FaUserCircle className={styles.avatar} />
                    )}

                    <div className={styles.dropdownHeaderInfo}>
                      <div className={styles.username}>{isAuth ? (profileData?.name || profileData?.email || "Your Account") : "Guest"}</div>
                      <div className={styles.userSub}>Manage your profile & settings</div>
                    </div>
                  </div>

                  <div className={styles.dropdownList}>
                    {isAuth && (
                      <Link to="/home" className={styles.dropdownitem} onClick={closeMenus}>
                        Home
                      </Link>
                    )}
                    <Link to="/myprofile" className={styles.dropdownitem} onClick={closeMenus}>
                      My Profile
                    </Link>
                    <Link to="/services/our-services" className={styles.dropdownitem} onClick={closeMenus}>
                      Our Services
                    </Link>
                    <Link to="/subscription" className={styles.dropdownitem} onClick={closeMenus}>
                      Subscription
                    </Link>
                    {isAuth && (
                      <button
                        type="button"
                        className={`${styles.dropdownitem} text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold`}
                        onClick={() => {
                          setAccountOpen(false);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        Delete Account
                      </button>
                    )}
                  </div>

                  <div className={styles.dropdownFooter}>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </div>
              )}

            </div>
          </nav>

          <button
            type="button"
            className={styles.mobiletoggle}
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {mobileOpen && (
          <div className={styles.mobilemenu}>
            {isAuth && (
              <Link to="/" className={styles.mobilelink} onClick={closeMenus}>
                Home
              </Link>
            )}
            <Link to="/subscription" className={styles.mobilelink} onClick={closeMenus}>
              My Subscription
            </Link>

            <div className={styles.mobileaccount}>
              <p className={styles.mobileaccountheading}>Account</p>
              <Link to="/myprofile" className={styles.mobilelink} onClick={closeMenus}>
                My Profile
              </Link>
              <button className={`${styles.mobilelink} w-full text-left bg-transparent border-none cursor-pointer`} onClick={handleLogout}>
                Logout
              </button>
              {isAuth && (
                <button
                  type="button"
                  className="block w-full text-left rounded-md px-4 py-3 text-[16px] font-semibold text-red-600 transition-colors hover:bg-red-50 cursor-pointer bg-transparent border-none"
                  onClick={() => {
                    setMobileOpen(false);
                    setShowDeleteConfirm(true);
                  }}
                >
                  Delete Account
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
            <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
              Are you sure you want to delete your account? This action is permanent and will delete all your user profiles, subscriptions, reviews, and uploaded photos from our systems.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-red-700 hover:shadow-md cursor-pointer disabled:opacity-50"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
