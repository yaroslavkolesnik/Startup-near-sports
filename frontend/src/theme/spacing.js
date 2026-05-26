export const spacing = {
  // Base Rhythm
  base: 8,
  sm: 4,
  md: 12,
  lg: 24,
  xl: 32,
  
  // Layout
  gutter: 16,
  margin: 20, // Mobile edge margin
  
  // Interaction
  safeTap: 44,
};

export const radii = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24, // Main card rounding
  pill: 9999, // Buttons and chips
};

export const shadows = {
  // Level 1: Cards
  level1: {
    shadowColor: '#f0edec', // surfaceContainer or dark for contrast
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 2, // Android
  },
  // Level 2: FABs, Modals
  level2: {
    shadowColor: '#0058bc', // Primary color shadow for FABs
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  }
};
