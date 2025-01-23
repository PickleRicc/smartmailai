const theme = {
  // Color palette based on the dark UI theme shown
  colors: {
    // Primary colors
    primary: {
      main: '#6B5ECD',      // Purple accent color from compose button
      light: '#8679E1',
      dark: '#4A3FA9',
    },
    // Background colors
    background: {
      default: '#1A1B1E',   // Main dark background
      paper: '#222327',     // Sidebar and card backgrounds
      hover: '#2A2B30',
    },
    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0A7',
      disabled: '#6C6C76',
    },
    // UI element colors
    border: '#2E2F34',
    divider: '#2E2F34',
    action: {
      active: '#FFFFFF',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.12)',
    },
    // Status colors
    status: {
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196f3',
    }
  },
  
  // Typography configuration
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
  },

  // Spacing and layout
  spacing: {
    unit: 8,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // Border radius
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    round: '50%',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },

  // Transitions
  transitions: {
    default: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Z-index
  zIndex: {
    drawer: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  }
};

export default theme;
