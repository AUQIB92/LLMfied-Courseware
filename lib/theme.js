// LLMfied Theme Configuration
// This file defines consistent color schemes and text styling across the project

export const theme = {
  // Primary Color Palette
  colors: {
    // Primary brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Secondary brand colors
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Accent colors
    accent: {
      purple: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
        800: '#6b21a8',
        900: '#581c87',
      },
      green: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      orange: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
      },
      red: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
    },
    
    // Semantic colors
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    
    // Neutral colors (replacing gray/slate inconsistencies)
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },
  
  // Text color classes
  text: {
    // Primary text colors
    primary: 'text-neutral-900',
    secondary: 'text-neutral-700',
    tertiary: 'text-neutral-500',
    muted: 'text-neutral-400',
    disabled: 'text-neutral-300',
    
    // Semantic text colors
    success: 'text-accent-green-600',
    warning: 'text-accent-orange-600',
    error: 'text-accent-red-600',
    info: 'text-primary-600',
    
    // Brand text colors
    brand: 'text-primary-600',
    brandSecondary: 'text-accent-purple-600',
    
    // Interactive text colors
    link: 'text-primary-600 hover:text-primary-700',
    linkSecondary: 'text-accent-purple-600 hover:text-accent-purple-700',
  },
  
  // Background color classes
  background: {
    // Primary backgrounds
    primary: 'bg-white',
    secondary: 'bg-neutral-50',
    tertiary: 'bg-neutral-100',
    
    // Card backgrounds
    card: 'bg-white',
    cardHover: 'bg-neutral-50',
    cardSecondary: 'bg-neutral-50',
    
    // Semantic backgrounds
    success: 'bg-accent-green-50',
    warning: 'bg-accent-orange-50',
    error: 'bg-accent-red-50',
    info: 'bg-primary-50',
    
    // Brand backgrounds
    brand: 'bg-primary-600',
    brandSecondary: 'bg-accent-purple-600',
    
    // Gradient backgrounds
    gradient: 'bg-gradient-to-br from-primary-50 via-white to-accent-purple-50',
    gradientCard: 'bg-gradient-to-br from-white to-neutral-50',
  },
  
  // Border color classes
  border: {
    // Primary borders
    primary: 'border-neutral-200',
    secondary: 'border-neutral-300',
    tertiary: 'border-neutral-100',
    
    // Semantic borders
    success: 'border-accent-green-200',
    warning: 'border-accent-orange-200',
    error: 'border-accent-red-200',
    info: 'border-primary-200',
    
    // Brand borders
    brand: 'border-primary-300',
    brandSecondary: 'border-accent-purple-300',
    
    // Interactive borders
    focus: 'border-primary-500 focus:border-primary-500',
    hover: 'border-neutral-400 hover:border-neutral-400',
  },
  
  // Button color schemes
  button: {
    primary: {
      base: 'bg-primary-600 hover:bg-primary-700 text-white',
      outline: 'border-primary-600 text-primary-600 hover:bg-primary-50',
      ghost: 'text-primary-600 hover:bg-primary-50',
    },
    secondary: {
      base: 'bg-accent-purple-600 hover:bg-accent-purple-700 text-white',
      outline: 'border-accent-purple-600 text-accent-purple-600 hover:bg-accent-purple-50',
      ghost: 'text-accent-purple-600 hover:bg-accent-purple-50',
    },
    success: {
      base: 'bg-accent-green-600 hover:bg-accent-green-700 text-white',
      outline: 'border-accent-green-600 text-accent-green-600 hover:bg-accent-green-50',
      ghost: 'text-accent-green-600 hover:bg-accent-green-50',
    },
    warning: {
      base: 'bg-accent-orange-600 hover:bg-accent-orange-700 text-white',
      outline: 'border-accent-orange-600 text-accent-orange-600 hover:bg-accent-orange-50',
      ghost: 'text-accent-orange-600 hover:bg-accent-orange-50',
    },
    error: {
      base: 'bg-accent-red-600 hover:bg-accent-red-700 text-white',
      outline: 'border-accent-red-600 text-accent-red-600 hover:bg-accent-red-50',
      ghost: 'text-accent-red-600 hover:bg-accent-red-50',
    },
  },
  
  // Form element colors
  form: {
    input: {
      base: 'border-neutral-300 focus:border-primary-500 text-neutral-900',
      error: 'border-accent-red-300 focus:border-accent-red-500',
      success: 'border-accent-green-300 focus:border-accent-green-500',
    },
    label: {
      base: 'text-neutral-700',
      required: 'text-accent-red-600',
    },
    helper: {
      base: 'text-neutral-500',
      error: 'text-accent-red-600',
      success: 'text-accent-green-600',
    },
  },
  
  // Status indicator colors
  status: {
    online: 'bg-accent-green-500',
    offline: 'bg-neutral-400',
    busy: 'bg-accent-orange-500',
    away: 'bg-accent-orange-400',
  },
  
  // Badge colors
  badge: {
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-accent-purple-100 text-accent-purple-700',
    success: 'bg-accent-green-100 text-accent-green-700',
    warning: 'bg-accent-orange-100 text-accent-orange-700',
    error: 'bg-accent-red-100 text-accent-red-700',
    info: 'bg-primary-100 text-primary-700',
  },
};

// Utility function to get consistent text colors
export const getTextColor = (variant = 'primary', weight = 'normal') => {
  const baseColor = theme.text[variant] || theme.text.primary;
  const weightClass = weight === 'bold' ? 'font-bold' : weight === 'semibold' ? 'font-semibold' : 'font-normal';
  return `${baseColor} ${weightClass}`;
};

// Utility function to get consistent background colors
export const getBackgroundColor = (variant = 'primary') => {
  return theme.background[variant] || theme.background.primary;
};

// Utility function to get consistent border colors
export const getBorderColor = (variant = 'primary') => {
  return theme.border[variant] || theme.border.primary;
};

// Utility function to get button colors
export const getButtonColor = (variant = 'primary', style = 'base') => {
  return theme.button[variant]?.[style] || theme.button.primary.base;
};

// CSS Variables for global theme consistency
export const cssVariables = `
  :root {
    /* Primary Colors */
    --color-primary-50: #eff6ff;
    --color-primary-100: #dbeafe;
    --color-primary-200: #bfdbfe;
    --color-primary-300: #93c5fd;
    --color-primary-400: #60a5fa;
    --color-primary-500: #3b82f6;
    --color-primary-600: #2563eb;
    --color-primary-700: #1d4ed8;
    --color-primary-800: #1e40af;
    --color-primary-900: #1e3a8a;
    
    /* Neutral Colors */
    --color-neutral-50: #fafafa;
    --color-neutral-100: #f5f5f5;
    --color-neutral-200: #e5e5e5;
    --color-neutral-300: #d4d4d4;
    --color-neutral-400: #a3a3a3;
    --color-neutral-500: #737373;
    --color-neutral-600: #525252;
    --color-neutral-700: #404040;
    --color-neutral-800: #262626;
    --color-neutral-900: #171717;
    
    /* Semantic Colors */
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    --color-info: #3b82f6;
    
    /* Text Colors */
    --text-primary: var(--color-neutral-900);
    --text-secondary: var(--color-neutral-700);
    --text-tertiary: var(--color-neutral-500);
    --text-muted: var(--color-neutral-400);
    
    /* Background Colors */
    --bg-primary: #ffffff;
    --bg-secondary: var(--color-neutral-50);
    --bg-tertiary: var(--color-neutral-100);
    
    /* Border Colors */
    --border-primary: var(--color-neutral-200);
    --border-secondary: var(--color-neutral-300);
    --border-focus: var(--color-primary-500);
  }
`;

// Theme-aware component classes
export const componentClasses = {
  // Card components
  card: {
    base: 'bg-white border border-neutral-200 rounded-lg shadow-sm',
    hover: 'hover:bg-neutral-50 hover:border-neutral-300 transition-colors',
    elevated: 'bg-white border border-neutral-200 rounded-lg shadow-md',
  },
  
  // Button components
  button: {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors',
    secondary: 'bg-accent-purple-600 hover:bg-accent-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium px-4 py-2 rounded-lg transition-colors',
    ghost: 'text-neutral-700 hover:bg-neutral-100 font-medium px-4 py-2 rounded-lg transition-colors',
  },
  
  // Input components
  input: {
    base: 'border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors',
    error: 'border-accent-red-300 focus:border-accent-red-500 focus:ring-accent-red-500',
    success: 'border-accent-green-300 focus:border-accent-green-500 focus:ring-accent-green-500',
  },
  
  // Label components
  label: {
    base: 'text-neutral-700 font-medium text-sm',
    required: 'text-accent-red-600',
  },
  
  // Badge components
  badge: {
    primary: 'bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium',
    secondary: 'bg-accent-purple-100 text-accent-purple-700 px-2 py-1 rounded-full text-xs font-medium',
    success: 'bg-accent-green-100 text-accent-green-700 px-2 py-1 rounded-full text-xs font-medium',
    warning: 'bg-accent-orange-100 text-accent-orange-700 px-2 py-1 rounded-full text-xs font-medium',
    error: 'bg-accent-red-100 text-accent-red-700 px-2 py-1 rounded-full text-xs font-medium',
  },
};

export default theme;
