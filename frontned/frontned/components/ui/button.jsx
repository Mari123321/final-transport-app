// src/components/ui/button.jsx
import React from 'react';

export const Button = ({ children, onClick, className, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg ${className}`}
  >
    {children}
  </button>
);
