"use client";
import { grey } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";
import { Russo_One } from "next/font/google";

const russo_one = Russo_One({
  subsets: ["cyrillic"],
  weight: ["400"],
});

// const bakbak_one = Bakbak_One({
//   subsets: ["latin-ext"],
//   weight: ["400"],
// });

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: grey["100"],
    },
  },
  typography: {
    fontFamily: russo_one.style.fontFamily,
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.severity === "info" && {
            backgroundColor: "#1e1e1e",
          }),
        }),
      },
    },
  },
});

export default theme;
