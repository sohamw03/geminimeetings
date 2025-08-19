"use client";
import { Avatar, Menu, MenuItem, Tooltip, IconButton, AppBar, Box, Toolbar, Typography, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CircleIcon from "@mui/icons-material/Circle";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

const settings = ["Profile", "Account", "Dashboard", "Logout"];

export default function Navbar() {
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [dateDisplay, setDateDisplay] = useState("");
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

  const handleOpenUserMenu = (event: any) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

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
    <Box sx={{ flexGrow: 1, position: "fixed", top: 0, left: 0, right: 0 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            <Link href={"/"}>GeminiMeetings</Link>
          </Typography>
          <Box sx={{ flexGrow: 0, display: "flex", alignItems: "center" }}>
            {/* Server status indicator with animated expandable Button (ripple retained) */}
            <Button
              onClick={() => handleKeepAlive(true)}
              color="inherit"
              variant="text"
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: showStatus && statusText ? "flex-start" : "center",
                gap: showStatus && statusText ? 1 : 0,
                minWidth: 40,
                px: showStatus && statusText ? 1.25 : 0.5,
                pr: showStatus && statusText ? 1.5 : 0.5,
                height: 40,
                overflow: "hidden",
                borderRadius: "2rem",
                transition: "max-width 0.35s ease, background-color 0.35s ease, padding 0.35s ease, opacity 0.3s ease",
                maxWidth: showStatus && statusText ? 260 : 44,
                width: "auto",
                backgroundColor: (theme) => (showStatus && statusText ? theme.palette.action.hover : "transparent"),
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.action.hover,
                },
              }}
              aria-live="polite"
              aria-label={statusText ? `Server status: ${statusText}` : undefined}>
              <CircleIcon color={isServerAlive ? "success" : "error"} sx={{ flexShrink: 0 }} />
              {showStatus && statusText && (
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

            <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1, px: 2, lineHeight: 1 }}>
              {dateDisplay}
            </Typography>

            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="" src="" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}>
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography textAlign="center">{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
