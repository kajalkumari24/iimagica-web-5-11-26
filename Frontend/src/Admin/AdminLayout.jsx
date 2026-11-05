import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate, Outlet } from "react-router-dom";
import styles from "./AdminLayout.module.css";
import ConfirmModal from "./components/ConfirmModal";
import { clearAuthToken } from "../utils/auth";
import { clearSessionAppState } from "../utils/appState";
import adminApi from "../utils/adminApi";
import {
  FaTachometerAlt,
  FaImage,
  FaLayerGroup,
  FaCalendarAlt,
  FaBell,
  FaChartLine,
  FaUserCircle,
  FaSignOutAlt,
  FaUsers,
  FaEnvelopeOpenText,
  FaCommentDots,
  FaTags,
  FaPalette,
  FaGlobe,
  FaChevronDown,
  FaChevronUp,
  FaFileContract 
} from "react-icons/fa";

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const menuItems = [
    { name: "Dashboard", icon: <FaTachometerAlt size={20} />, path: "/admin/home" },
    { name: "Manage Blogs", icon: <FaFileContract size={20} />, path: "/admin/blogs" },
    { name: "Manage Frames", icon: <FaLayerGroup size={20} />, path: "/admin/manage-frames" },
    { name: "Manage Images", icon: <FaImage size={20} />, path: "/admin/manage-images" },
    { name: "Manage Plans", icon: <FaGlobe size={20} />, path: "/admin/manage-plans" },
    { name: "Home Slides", icon: <FaImage size={20} />, path: "/admin/home-slides" },
    {
      name: "Design",
      icon: <FaPalette size={20} />,
      dropdown: [
        { name: "Banners", path: "/admin/design/banners" },
        { name: "Logo", path: "/admin/design/logo" },
        { name: "Website", path: "/admin/design/website" },
        { name: "Visiting Card", path: "/admin/design/visiting-card" },
        { name: "Digital Card", path: "/admin/design/digital-card" },
        { name: "Templates", path: "/admin/design/templates" },
      ],
    },
    { name: "Design Categories", icon: <FaPalette size={20} />, path: "/admin/design-categories" },
    { name: "Manage Calendar", icon: <FaCalendarAlt size={20} />, path: "/admin/manage-calendar" },
    { name: "Categories", icon: <FaTags size={20} />, path: "/admin/categories" },
    { name: "Users", icon: <FaUsers size={20} />, path: "/admin/users" },
    { name: "User Profiles", icon: <FaUserCircle size={20} />, path: "/admin/user-profiles" },
    {
      name: "Notifications",
      icon: <FaBell size={20} />,
      path: "/admin/notifications",
      dropdown: [
        { name: "Manage Notifications", path: "/admin/notifications" },
        { name: "Push Notification", path: "/admin/push-notification" },
      ]
    },
    { name: "Analytics", icon: <FaChartLine size={20} />, path: "/admin/analytics" },
    { name: "Feedback", icon: <FaCommentDots size={20} />, path: "/admin/feedback" },
    { name: "Reviews", icon: <FaCommentDots size={20} />, path: "/admin/reviews" },
    { name: "Contacts", icon: <FaEnvelopeOpenText size={20} />, path: "/admin/contacts" },
    { name: "Privacy Policy", icon: <FaFileContract size={20} />, path: "/admin/privacy-policy" },
    { name: "Terms & Conditions", icon: <FaFileContract size={20} />, path: "/admin/manage-terms-and-conditions" },
  ];

  const getActiveFromPath = (path) => {
    const found = menuItems.find((m) => {
      if (m.dropdown) {
        return m.dropdown.some(sub => path.startsWith(sub.path));
      }
      return path.startsWith(m.path);
    });
    return found ? found.name : "Dashboard";
  };

  const [active, setActive] = useState(() => getActiveFromPath(location.pathname || ''));

  const handleMenuClick = (item) => {
    if (item.dropdown) {
      setOpenDropdowns(prev => ({ ...prev, [item.name]: !prev[item.name] }));
    } else {
      setActive(item.name);
      navigate(item.path);
      if (mobileMenuOpen) setMobileMenuOpen(false);
    }
  };

  const handleSubMenuClick = (subItem, parentName) => {
    setActive(parentName);
    navigate(subItem.path);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  useEffect(() => {
    const path = location.pathname || '';
    const found = menuItems.find((m) => {
      if (m.dropdown) return m.dropdown.some(sub => path.startsWith(sub.path));
      return path.startsWith(m.path);
    });
    if (found) {
      setActive(found.name);
      if (found.dropdown) {
        setOpenDropdowns(prev => ({ ...prev, [found.name]: true }));
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest(`.${styles.sidebar}`) && !event.target.closest(`.${styles.mobileMenuBtn}`)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Close modals/menus on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showLogoutConfirm) setShowLogoutConfirm(false);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutConfirm, mobileMenuOpen]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Overlay — closes sidebar on mobile when clicked */}
      {mobileMenuOpen && (
        <div
          className={styles.overlay}
          style={{ display: 'block' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={`${styles.sidebar} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.avatar}>
            <span>IM</span>
          </div>
          <div className={styles.brandText}>Imagica Admin</div>
        </div>

        <nav className={styles.menuWrap}>
          <ul className={styles.menuList}>
            {menuItems.map((item, index) => (
              <li key={item.name}>
                <div
                  className={`${styles.menuItem} ${
                    active === item.name ? styles.menuItemActive : styles.menuItemHover
                  }`}
                  onClick={() => handleMenuClick(item)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span className={styles.menuIcon}>{item.icon}</span>
                  <span className={styles.menuLabel}>{item.name}</span>
                  {item.dropdown && (
                    <span className={styles.dropdownIcon}>
                      {openDropdowns[item.name] ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </span>
                  )}
                </div>
                {item.dropdown && openDropdowns[item.name] && (
                  <ul className={styles.subMenu}>
                    {item.dropdown.map((subItem) => (
                      <li
                        key={subItem.path}
                        className={`${styles.subMenuItem} ${location.pathname === subItem.path || location.pathname.startsWith(subItem.path) ? styles.subMenuItemActive : ''}`}
                        onClick={() => handleSubMenuClick(subItem, item.name)}
                      >
                        {subItem.name}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <div
            className={`${styles.menuItem} ${styles.logoutItem}`}
            onClick={handleLogout}
          >
            <span className={styles.menuIcon}>
              <FaSignOutAlt size={20} />
            </span>
            <span className={styles.menuLabel}>Logout</span>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <button 
          className={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
        
        <Outlet />
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout from the admin panel?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          try {
            await adminApi.post("/api/admins/logout");
          } catch (err) {
            console.warn('Logout API call failed:', err);
          } finally {
            clearAuthToken('adminToken');
            clearSessionAppState();
            setShowLogoutConfirm(false);
            navigate('/adminlogin');
          }
        }}
      />
    </div>
  );
}

export default AdminLayout;
