import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div classname={`rounded-2xl shadow-md bg-white ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div classname={`p-6 ${className}`}>{children}</div>;
}
