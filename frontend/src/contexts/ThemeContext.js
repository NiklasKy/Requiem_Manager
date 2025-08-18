import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#5865f2', // Discord Blurple
        light: '#7289da',
        dark: '#4752c4',
      },
      secondary: {
        main: '#43b581', // Discord Green
        light: '#5dbf89',
        dark: '#3ca374',
      },
      background: {
        default: '#f8f9fa',
        paper: '#ffffff',
      },
      text: {
        primary: '#2c2f33',
        secondary: '#72767d',
      },
      divider: '#e3e5e8',
    },
    typography: {
      fontFamily: '"Whitney", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 10px 0 rgba(0,0,0,0.1)',
            borderRadius: 8,
            transition: 'box-shadow 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 4px 20px 0 rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 4,
            fontWeight: 500,
          },
        },
      },
    },
  });

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#5865f2', // Discord Blurple
        light: '#7289da',
        dark: '#4752c4',
      },
      secondary: {
        main: '#43b581', // Discord Green
        light: '#5dbf89',
        dark: '#3ca374',
      },
      background: {
        default: '#36393f', // Discord Dark Gray
        paper: '#2f3136', // Discord Darker Gray
      },
      text: {
        primary: '#dcddde', // Discord Light Text
        secondary: '#b9bbbe', // Discord Secondary Text
      },
      divider: '#4f545c', // Discord Border
      error: {
        main: '#ed4245', // Discord Red
      },
      warning: {
        main: '#faa61a', // Discord Yellow
      },
      info: {
        main: '#5865f2', // Discord Blurple
      },
      success: {
        main: '#43b581', // Discord Green
      },
    },
    typography: {
      fontFamily: '"Whitney", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
        color: '#ffffff',
      },
      h5: {
        fontWeight: 600,
        color: '#ffffff',
      },
      h6: {
        fontWeight: 600,
        color: '#ffffff',
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#2f3136',
            boxShadow: '0 2px 10px 0 rgba(0,0,0,0.3)',
            borderRadius: 8,
            transition: 'box-shadow 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 4px 20px 0 rgba(0,0,0,0.4)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 4,
            fontWeight: 500,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#23272a', // Discord Darker
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#4f545c',
              },
              '&:hover fieldset': {
                borderColor: '#5865f2',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: '#4f545c',
            color: '#dcddde',
            '&:hover': {
              backgroundColor: '#5865f2',
            },
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
