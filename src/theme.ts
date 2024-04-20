"use client";
import { IBM_Plex_Sans } from "next/font/google";
import { createTheme } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

const ibm_plex_sans = IBM_Plex_Sans({
  //
  subsets: ["cyrillic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: grey["100"],
    },
  },
  typography: {
    fontFamily: ibm_plex_sans.style.fontFamily,
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.severity === "info" && {
            backgroundColor: "#101418",
          }),
        }),
      },
    },
  },
});

export default theme;
