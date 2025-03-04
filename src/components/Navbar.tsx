"use client";
import { Avatar, Menu, MenuItem, Tooltip, IconButton, AppBar, Box, Toolbar, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CircleIcon from '@mui/icons-material/Circle';
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

const settings = ["Profile", "Account", "Dashboard", "Logout"];

export default function Navbar() {
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [dateDisplay, setDateDisplay] = useState("");
  const [isServerAlive, setIsServerAlive] = useState(false);
  const keepAliveDebounce = useRef<NodeJS.Timeout>();

  // Manually trigger server keep alive
  const handleKeepAlive = () => {
    try {
      clearInterval(keepAliveDebounce.current);
      keepAliveDebounce.current = setTimeout(async() => {
        await fetch(`${process.env.NEXT_PUBLIC_WS_HOST}/api/keep-alive`);
        setIsServerAlive(true);
      }, 1000);
    } catch (error) {
      setIsServerAlive(false);
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
    handleKeepAlive();
    const interval = setInterval(handleKeepAlive, 10000);
    return () => clearInterval(interval);
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
            <IconButton onClick={handleKeepAlive}>
              <CircleIcon color={isServerAlive ? "success" : "error"} />
            </IconButton>

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
