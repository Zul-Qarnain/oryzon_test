import React from 'react';

interface CloseIconProps {
  onClick?: () => void;
  className?: string; // Allow className to be passed for more flexibility
}

const CloseIcon: React.FC<CloseIconProps> = ({ onClick, className }) => (
  <svg
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-5 h-5 sm:w-6 sm:h-6 text-color-muted hover:text-color-primary transition-colors duration-300 cursor-pointer ${className || ''}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default CloseIcon;
