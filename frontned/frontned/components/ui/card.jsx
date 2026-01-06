// src/components/ui/card.jsx
import React from 'react';

export const Card = ({ children, className }) => (
  <div className={`rounded-2xl shadow-md p-4 bg-white border ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className }) => (
  <div className={`p-2 ${className}`}>
    {children}
  </div>
);
