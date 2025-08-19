"use client";
import { Tooltip, AppBar, Box, Toolbar, Typography, Button, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CircleIcon from "@mui/icons-material/Circle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

// Profile/settings menu removed per request

export default function Navbar() {
  const [dateDisplay, setDateDisplay] = useState("");
  const [timeShort, setTimeShort] = useState("");
  const [dateShort, setDateShort] = useState("");
  const [isServerAlive, setIsServerAlive] = useState(false);
  const keepAliveDebounce = useRef<NodeJS.Timeout>();
  const [statusText, setStatusText] = useState<string>("");
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownInitialRef = useRef(false);
  const isServerAliveRef = useRef(false);

  // Manually trigger server keep alive
  const scheduleHide = (delayMs: number) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowStatus(false);
      // After animation ends clear text for accessibility (delay matches CSS ~350ms slack)
      setTimeout(() => setStatusText(""), 400);
    }, delayMs);
  };

  const handleKeepAlive = (manual: boolean = false) => {
    try {
      clearInterval(keepAliveDebounce.current);
      keepAliveDebounce.current = setTimeout(async () => {
        const prevAlive = isServerAliveRef.current;
        try {
          if (!hasShownInitialRef.current || manual || !prevAlive) {
            setStatusText("starting backend");
            setShowStatus(true);
          }
          await fetch(`${process.env.NEXT_PUBLIC_WS_HOST}/api/keep-alive`);
          setIsServerAlive(true);
          isServerAliveRef.current = true;
          if (!hasShownInitialRef.current || manual || !prevAlive) {
            setStatusText("connected");
            setShowStatus(true);
            scheduleHide(2000);
          }
          hasShownInitialRef.current = true;
        } catch (err) {
          setIsServerAlive(false);
          isServerAliveRef.current = false;
          // Persist 'starting backend' until a successful connection; never show 'offline'
          if (!isServerAliveRef.current) {
            setStatusText("starting backend");
            setShowStatus(true);
          }
        }
      }, 300); // quicker feedback
    } catch (error) {
      setIsServerAlive(false);
      isServerAliveRef.current = false;
      setStatusText("starting backend");
      setShowStatus(true);
      console.error("Error keeping server alive: ", error);
    }
  };

  // Removed user menu handlers

  useEffect(() => {
    const setDate = () => {
      setDateDisplay(() => {
        const currentDate = new Date();
        const hours = currentDate.getHours();
        const minutes = currentDate.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, "0");
        const day = currentDate.toLocaleString("en-US", { weekday: "short" });
        const month = currentDate.toLocaleString("en-US", { month: "short" });
        const date = currentDate.getDate();
  // Short (time only) for compact mobile UI
  setTimeShort(`${formattedHours}:${formattedMinutes} ${ampm}`);
  setDateShort(`${day}, ${month} ${date}`);
        return `${formattedHours}:${formattedMinutes} ${ampm} • ${day}, ${month} ${date}`;
      });
    };
    setDate();
    const interval = setInterval(setDate, 5000);
    return () => clearInterval(interval);
  }, []);

  // Keep alive server: pings server to keep it alive
  useEffect(() => {
    // Kick off initial status
    setStatusText("starting backend");
    setShowStatus(true);
    handleKeepAlive(false);
    const interval = setInterval(() => handleKeepAlive(false), 10000);
    return () => {
      clearInterval(interval);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <ResponsiveNavbarContent
      isServerAlive={isServerAlive}
      dateDisplay={dateDisplay}
      timeShort={timeShort}
      dateShort={dateShort}
      showStatus={showStatus}
      statusText={statusText}
      handleKeepAlive={handleKeepAlive}
    />
  );
}

// Extracted presentational component for easier responsive handling
function ResponsiveNavbarContent({
  isServerAlive,
  dateDisplay,
  timeShort,
  dateShort,
  showStatus,
  statusText,
  handleKeepAlive,
}: {
  isServerAlive: boolean;
  dateDisplay: string;
  timeShort: string;
  dateShort: string;
  showStatus: boolean;
  statusText: string;
  handleKeepAlive: (manual?: boolean) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ flexGrow: 1, position: "fixed", top: 0, left: 0, right: 0, zIndex: 1100 }}>
      <AppBar position="static">
        <Toolbar
          disableGutters
          sx={{
            px: 2,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          <Typography
            variant="h5"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold", mr: 1, whiteSpace: 'nowrap' }}
          >
            <Link href={"/"}>GeminiMeetings</Link>
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            {/* Server status indicator with animated expandable Button (ripple retained) */}
            <Button
              onClick={() => handleKeepAlive(true)}
              color="inherit"
              variant="text"
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: showStatus && statusText && !isMobile ? "flex-start" : "center",
                gap: showStatus && statusText && !isMobile ? 1 : 0,
                minWidth: isMobile ? 36 : 40,
                px: showStatus && statusText && !isMobile ? 1.25 : 0.75,
                pr: showStatus && statusText && !isMobile ? 1.5 : 0.75,
                height: 38,
                overflow: "hidden",
                borderRadius: "2rem",
                transition: "max-width 0.35s ease, background-color 0.35s ease, padding 0.35s ease, opacity 0.3s ease",
                maxWidth: showStatus && statusText && !isMobile ? 220 : 46,
                width: "auto",
                backgroundColor: (theme) => (showStatus && statusText && !isMobile ? theme.palette.action.hover : "transparent"),
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.action.hover,
                },
              }}
              aria-live="polite"
              aria-label={statusText ? `Server status: ${statusText}` : undefined}>
              <CircleIcon color={isServerAlive ? "success" : "error"} sx={{ flexShrink: 0 }} />
              {showStatus && statusText && !isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    lineHeight: 1,
                    flexGrow: 1,
                    whiteSpace: "nowrap",
                    textTransform: "none",
                    letterSpacing: 0.5,
                    fontWeight: 500,
                    userSelect: "none",
                    textAlign: "left",
                  }}>
                  {statusText}
                </Typography>
              )}
            </Button>
            {/* Date / Time - adapt for mobile */}
            {isMobile ? (
              <Tooltip title={dateDisplay} placement="bottom" arrow>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.5 }}>
                  <AccessTimeIcon fontSize="small" />
                  <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <Typography variant="body2" sx={{ lineHeight: 1, fontWeight: 500 }} noWrap>{timeShort}</Typography>
                    <Typography variant="caption" sx={{ lineHeight: 1, opacity: 0.85 }} noWrap>{dateShort}</Typography>
                  </Box>
                </Box>
              </Tooltip>
            ) : (
              <Typography variant="subtitle1" component="div" sx={{ lineHeight: 1, whiteSpace: "nowrap", px: 1 }}>
                {dateDisplay}
              </Typography>
            )}

            {/* Profile button removed intentionally */}
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
