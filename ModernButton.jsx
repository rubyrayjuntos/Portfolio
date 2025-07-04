import React from 'react';
import './ModernButton.css';

const ModernButton = ({
  children,
  variant = 'glass',
  size = 'default',
  icon,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'modern-btn';
  const variantClass = `modern-btn-${variant}`;
  const sizeClass = size !== 'default' ? `modern-btn-${size}` : '';
  const iconClass = icon ? 'modern-btn-icon' : '';
  const loadingClass = loading ? 'modern-btn-loading' : '';
  const disabledClass = disabled ? 'modern-btn-disabled' : '';
  
  const buttonClass = [
    baseClass,
    variantClass,
    sizeClass,
    iconClass,
    loadingClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="loading-spinner"></span>}
      {icon && <span className="btn-icon">{icon}</span>}
      <span className="btn-content">{children}</span>
    </button>
  );
};

// Specific button variants as separate components
export const GlassButton = (props) => <ModernButton variant="glass" {...props} />;
export const GradientButton = (props) => <ModernButton variant="gradient" {...props} />;
export const NeonButton = (props) => <ModernButton variant="neon" {...props} />;
export const FloatingButton = (props) => <ModernButton variant="floating" {...props} />;
export const Button3D = (props) => <ModernButton variant="3d" {...props} />;

export default ModernButton; 