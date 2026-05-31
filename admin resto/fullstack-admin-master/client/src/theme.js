// color design tokens export
export const tokensDark = {
  grey: {
    0: "#fffdf9",
    10: "#f7f2ed",
    50: "#eee7e0",
    100: "#ddd3ca",
    200: "#bfaea1",
    300: "#9f8c7f",
    400: "#7b6b63",
    500: "#5f524d",
    600: "#483d3a",
    700: "#342b29",
    800: "#211b1a",
    900: "#141112",
    1000: "#090708",
  },
  primary: {
    100: "#f6d8d8",
    200: "#ebb0b0",
    300: "#de8787",
    400: "#cf5f5f",
    500: "#a61f2d",
    600: "#831823",
    700: "#65121b",
    800: "#430b12",
    900: "#210509",
  },
  secondary: {
    50: "#fdf7f1",
    100: "#f8ebde",
    200: "#efd6bb",
    300: "#e4bb91",
    400: "#dba06b",
    500: "#c98045",
    600: "#9f6535",
    700: "#774a27",
    800: "#4f321a",
    900: "#28190d",
  },
};

// function that reverses the color palette
function reverseTokens(tokensDark) {
  const reversedTokens = {};
  Object.entries(tokensDark).forEach(([key, val]) => {
    const keys = Object.keys(val);
    const values = Object.values(val);
    const length = keys.length;
    const reversedObj = {};
    for (let i = 0; i < length; i++) {
      reversedObj[keys[i]] = values[length - i - 1];
    }
    reversedTokens[key] = reversedObj;
  });
  return reversedTokens;
}
export const tokensLight = reverseTokens(tokensDark);

// mui theme settings
export const themeSettings = (mode) => {
  const isDark = mode === "dark";
  const disabledText = isDark ? tokensDark.grey[100] : tokensDark.grey[700];
  const disabledBackground = isDark
    ? "rgba(255, 255, 255, 0.14)"
    : "rgba(166, 31, 45, 0.08)";
  const disabledBorder = isDark
    ? "rgba(255, 255, 255, 0.22)"
    : "rgba(166, 31, 45, 0.18)";

  return {
    palette: {
      mode: mode,
      ...(isDark
        ? {
            // palette values for dark mode
            primary: {
              ...tokensDark.primary,
              main: tokensDark.primary[400],
              light: tokensDark.primary[400],
            },
            secondary: {
              ...tokensDark.secondary,
              main: tokensDark.secondary[300],
            },
            neutral: {
              ...tokensDark.grey,
              main: tokensDark.grey[500],
            },
            background: {
              default: "#120d0e",
              alt: "#1a1214",
              paper: "#1f1719",
            },
          }
        : {
            // palette values for light mode
            primary: {
              ...tokensLight.primary,
              main: tokensDark.primary[500],
              light: tokensDark.primary[300],
              dark: tokensDark.primary[700],
              contrastText: "#fffaf6",
            },
            secondary: {
              ...tokensLight.secondary,
              main: tokensDark.secondary[500],
              light: tokensDark.secondary[300],
              dark: tokensDark.secondary[700],
              contrastText: "#2d160a",
            },
            neutral: {
              ...tokensLight.grey,
              main: tokensDark.grey[500],
            },
            background: {
              default: "#f8f3ec",
              alt: "#fffdfa",
              paper: "#ffffff",
            },
          }),
      success: { main: "#2f7d57" },
      warning: { main: "#c2832b" },
      error: { main: "#c14958" },
      info: { main: "#7b3f00" },
      divider: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
      text: {
        primary: isDark ? tokensDark.grey[10] : "#0f172a",
        secondary: isDark ? tokensDark.grey[300] : "#475569",
      },
      action: {
        hover: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
      },
    },
    typography: {
      fontFamily: ["Manrope", "Inter", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Manrope", "Inter", "sans-serif"].join(","),
        fontSize: 40,
        fontWeight: 800,
      },
      h2: {
        fontFamily: ["Manrope", "Inter", "sans-serif"].join(","),
        fontSize: 32,
        fontWeight: 800,
      },
      h3: {
        fontFamily: ["Manrope", "Inter", "sans-serif"].join(","),
        fontSize: 24,
        fontWeight: 700,
      },
      h4: {
        fontFamily: ["Manrope", "Inter", "sans-serif"].join(","),
        fontSize: 20,
        fontWeight: 700,
      },
      h5: {
        fontFamily: ["Manrope", "Inter", "sans-serif"].join(","),
        fontSize: 16,
        fontWeight: 700,
      },
      h6: {
        fontFamily: ["Manrope", "Inter", "sans-serif"].join(","),
        fontSize: 14,
        fontWeight: 700,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 12,
            fontWeight: 600,
            paddingInline: 16,
          },
          contained: {
            boxShadow: "none",
            ...(isDark
              ? {}
              : {
                  backgroundImage:
                    "linear-gradient(135deg, rgba(166,31,45,1) 0%, rgba(201,128,69,1) 100%)",
                  color: "#fffaf6",
                }),
          },
          outlined: {
            borderWidth: 1.5,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: 12,
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: isDark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(123,107,99,0.12)",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: "small",
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 14,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isDark
              ? "radial-gradient(circle at top left, rgba(166,31,45,0.18), transparent 28%), radial-gradient(circle at top right, rgba(201,128,69,0.1), transparent 22%)"
              : "radial-gradient(circle at top left, rgba(166,31,45,0.08), transparent 26%), radial-gradient(circle at top right, rgba(201,128,69,0.07), transparent 22%)",
            backgroundColor: isDark ? "#120d0e" : "#f8f3ec",
          },
          "#root": {
            minHeight: "100vh",
          },
          ".MuiButton-root.Mui-disabled": {
            opacity: 1,
            color: `${disabledText} !important`,
            backgroundColor: `${disabledBackground} !important`,
            borderColor: `${disabledBorder} !important`,
          },
          ".MuiButton-outlined.Mui-disabled": {
            backgroundColor: "transparent !important",
          },
          ".MuiDataGrid-root": {
            borderRadius: 20,
            overflow: "hidden",
          },
          ".MuiDataGrid-columnHeaders": {
            backdropFilter: "blur(18px)",
          },
        },
      },
    },
  };
};
