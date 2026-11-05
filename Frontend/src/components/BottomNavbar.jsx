import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import './BottomNavbar.css';
import SearchIcon from '../assets/online-marketing1.png';

const BottomNavbar = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const handleClick = (item) => {
    sessionStorage.removeItem("homeScrollY");
    window.scrollTo(0, 0);
    navigate(item.path);
  };

  const navItems = [
    { path: '/home', icon: <HomeIcon />, label: 'Home' },
    { path: '/services/our-services', icon: <img src={SearchIcon} alt="Services" style={{ width: '24px', height: '24px' }} />, label: 'Services' },
    { path: '/notification', icon: <NotificationsIcon />, label: 'Notifications' },
    { path: '/myprofile', icon: <PersonIcon />, label: 'Profile' }
  ];

  return (
    <nav className="bottom-navbar">
      {navItems.map((item, index) => (
        <button
          key={index}
          className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => handleClick(item)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNavbar;
