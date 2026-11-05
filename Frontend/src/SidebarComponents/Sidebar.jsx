import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Menu</h2>
      <ul className="sidebar-list">
        <li><Link to="/myprofile">My Profile</Link></li>
        <li><Link to="/premium">My Premium</Link></li>
        <li><Link to="/feedback">Feedback</Link></li>
        <li><Link to="/support">Help & Support</Link></li>
      </ul>
    </div>
  );
}
