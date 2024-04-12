// import { GlobalContextProvider } from "@/contextWithDrivers/GlobalContext";
import theme from "@/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />
          {props.children}
        </ThemeProvider>
      </body>
    </html>
  );
}
