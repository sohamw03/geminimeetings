import Navbar from "@/components/navbar";
// import { GlobalContextProvider } from "@/contextWithDrivers/GlobalContext";
import theme from "@/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GeminiMeetings",
  description: "GeminiMeetings: Seamless video conferencing and collaboration for productive teams.",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />
          <Navbar />
          {props.children}
        </ThemeProvider>
      </body>
    </html>
  );
}
