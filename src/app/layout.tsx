import { GlobalContextProvider } from "@/globalContext/GlobalContext";
import theme from "@/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeminiMeetings",
  description: "GeminiMeetings: Seamless video conferencing and collaboration for productive teams.",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GlobalContextProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {props.children}
          </ThemeProvider>
        </GlobalContextProvider>
      </body>
    </html>
  );
}
