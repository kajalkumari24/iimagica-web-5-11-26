import React from "react";

export function Button({ children, className = "", ...props }) {
  return (
    <button
      classname={`bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
