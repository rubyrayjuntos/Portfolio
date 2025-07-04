import React, { useState } from 'react';
import ModernButton, { 
  GlassButton, 
  GradientButton, 
  NeonButton, 
  FloatingButton, 
  Button3D 
} from './ModernButton';
import './ModernButton.css';

const ModernButtonDemo = () => {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light');

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme === 'dark' ? 'dark' : '');
  };

  return (
    <div className="demo-container" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-secondary) 100%)'
    }}>
      <button 
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          background: 'var(--glass)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text)',
          padding: '0.75rem',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '1.25rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Modern Button Components
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-light)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          React component showcase with glassmorphism, gradients, and modern design patterns
        </p>
      </div>

      {/* Glassmorphism Buttons */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
          color: 'var(--text)',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '0.5rem'
        }}>
          Glassmorphism Buttons
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            background: 'var(--glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text)', margin: 0 }}>Glass Button</h3>
            <GlassButton>Glass Effect</GlassButton>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            background: 'var(--glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text)', margin: 0 }}>Floating Button</h3>
            <FloatingButton>Floating</FloatingButton>
          </div>
        </div>
      </div>

      {/* Gradient Buttons */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
          color: 'var(--text)',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '0.5rem'
        }}>
          Gradient Buttons
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            background: 'var(--glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text)', margin: 0 }}>Gradient Button</h3>
            <GradientButton>Gradient</GradientButton>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            background: 'var(--glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text)', margin: 0 }}>Neon Button</h3>
            <NeonButton>Neon Glow</NeonButton>
          </div>
        </div>
      </div>

      {/* 3D Buttons */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
          color: 'var(--text)',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '0.5rem'
        }}>
          3D Buttons
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            background: 'var(--glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text)', margin: 0 }}>3D Press Effect</h3>
            <Button3D>3D Button</Button3D>
          </div>
        </div>
      </div>

      {/* Button Sizes */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
          color: 'var(--text)',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '0.5rem'
        }}>
          Button Sizes
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Small</h4>
            <GlassButton size="sm">Small</GlassButton>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Default</h4>
            <GlassButton>Default</GlassButton>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Large</h4>
            <GlassButton size="lg">Large</GlassButton>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Extra Large</h4>
            <GlassButton size="xl">Extra Large</GlassButton>
          </div>
        </div>
      </div>

      {/* Icon Buttons */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
          color: 'var(--text)',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '0.5rem'
        }}>
          Icon Buttons
        </h2>
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <ModernButton variant="glass" size="sm" icon="⚡" />
          <ModernButton variant="gradient" icon="🚀" />
          <ModernButton variant="neon" size="lg" icon="💎" />
        </div>
      </div>

      {/* Loading States */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
          color: 'var(--text)',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '0.5rem'
        }}>
          Loading States
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            background: 'var(--glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text)', margin: 0 }}>Loading Button</h3>
            <ModernButton 
              variant="glass" 
              loading={loading}
              onClick={handleLoadingClick}
            >
              {loading ? 'Loading...' : 'Click to Load'}
            </ModernButton>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            background: 'var(--glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text)', margin: 0 }}>Disabled Button</h3>
            <ModernButton variant="gradient" disabled>
              Disabled
            </ModernButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernButtonDemo; 