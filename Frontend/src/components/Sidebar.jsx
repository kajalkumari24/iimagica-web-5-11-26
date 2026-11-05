// Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  const location = useLocation();

  const options = [
    { name: "Template", path: "/template" },

    { name: "Create Logo", path: "/create-logo" },
    { name: "Digital Business Visiting Card", path: "/create-digital-card" },
    { name: "Website Templates", path: "/Website" },
    { name: "Digital Business Poster", path: "/Poster" },

  ];

  return (
    <div className={styles.sidebar}>
      {options.map((option) => (
        <Link
          key={option.name}
          to={option.path}
          className={`${styles.option} ${
            location.pathname === option.path ? styles.active : ""
          }`}
        >
          {option.name}
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;
