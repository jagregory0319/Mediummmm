import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#B39DDB',   // lavender
      contrastText: '#fff',
    },
    secondary: {
      main: '#80CBC4',   // mint-green
      contrastText: '#fff',
    },
    warning: {
      main: '#FFF59D',   // soft yellow
      contrastText: '#000',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 12,     // softly rounded corners
  },
  typography: {
    fontFamily: '"Comic Neue", "Poppins", sans-serif',
    h4: { fontWeight: 700 },
    button: { textTransform: 'none' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,     // pill-shape
          padding: '8px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(45deg, #B39DDB, #80CBC4)',
          },
          '&.MuiButton-containedSecondary': {
            background: 'linear-gradient(45deg, #80CBC4, #FFF59D)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

export default theme;
