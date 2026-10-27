export const Colors = {
  Primary: '#0754C0',       // Signature brand anchor
  PrimaryDark: '#053E8F',   // Deep brand blue for active states & high-contrast elements
  PrimaryLight: '#E6EEFA',  // Soft brand blue tint
  PrimaryMuted: '#EFF6FF',  // Luminous ultra-soft blue background
  PrimarySurface: '#F0F5FD',

  Accent: '#0EA5E9',        // Sky/Teal accent color
  AccentLight: '#E0F2FE',   // Soft sky blue tint

  Success: '#15803D',       // Premium Dark Green (WCAG AAA compliant)
  SuccessLight: '#ECFDF5',  // Soft green tint
  SuccessDark: '#166534',

  Warning: '#D97706',       // Refined warm amber
  WarningLight: '#FEF3C7',
  WarningDark: '#B45309',

  Danger: '#EF4444',        // Premium Red
  DangerLight: '#FEF2F2',
  DangerDark: '#DC2626',

  // Slate-tinted Grays with readable contrast & Apple/Linear-grade neutrals:
  Gray100: '#0F172A',       // Slate 900 (Primary text)
  Gray200: '#1E293B',       // Slate 800 (Secondary text)
  Gray300: '#334155',       // Slate 700 (Medium slate)
  Gray400: '#475569',       // Slate 600 (Muted text)
  Gray500: '#64748B',       // Slate 500 (Subtext)
  Gray600: '#94A3B8',       // Slate 400 (Placeholders)
  Gray700: '#CBD5E1',       // Slate 300 (Dividers)
  Gray800: '#E2E8F0',       // Slate 200 (Borders)
  Gray900: '#F1F5F9',       // Slate 100 (Secondary background)
  Gray50: '#F8FAFC',        // Slate 50 (App canvas background)

  White: '#FFFFFF',
  Overlay: 'rgba(15, 23, 42, 0.45)',
  OverlayDark: 'rgba(15, 23, 42, 0.65)',
  Red: '#EF4444',

  // Premium Gold Accents
  Gold: '#D4AF37',
  GoldLight: '#FFFDF0',
  GoldDark: '#B8860B',

  // Surfaces & Borders
  SurfaceCard: '#FFFFFF',
  SurfaceSubtle: '#F8FAFC',
  BorderSubtle: '#F1F5F9',
  BorderLight: '#E2E8F0',
};

export const Shadows = {
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  float: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  primary: {
    shadowColor: '#0754C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
};