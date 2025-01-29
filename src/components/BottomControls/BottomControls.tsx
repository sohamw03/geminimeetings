"use client";

import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { VideocamOff } from "@mui/icons-material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PresentToAllIcon from "@mui/icons-material/PresentToAll";
import ShieldIcon from "@mui/icons-material/Shield";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import VideocamIcon from "@mui/icons-material/Videocam";
import ChatIcon from "@mui/icons-material/Chat";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";
import Settings from "./Settings/Settings";
import Chat from "../Chat/Chat";

export default function BottomControls() {
  // Global Context
  const { leaveRoom, toggleAudioMute, toggleVideoMute, isAudioMuted, isVideoMuted, isScreenSharing, toggleScreenShare }: Values = useGlobal();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [showChat, setShowChat] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    window.onmessage = (e) => {
      if (e.data === "showChat" && e.origin === window.location.origin) {
        setShowChat(true);
      }
    };
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        height: "100%",
        px: { xs: 1, md: 0 },
      }}>
      {/* Placeholder (Left) */}
      <Box>
        <Button
          disabled
          sx={{
            ml: { xs: 1, md: 3.5 },
            display: { md: "flex" },
          }}>
          <ShieldIcon fontSize="large" />
        </Button>
      </Box>
      {/* Media Controls (Center) */}
      <Box
        sx={{
          gap: { xs: "0.5rem", md: "1rem" },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <Button
          onClick={() => {
            toggleAudioMute();
          }}
          className="border-2 border-gray-700 border-solid"
          color={!isAudioMuted ? "primary" : "error"}
          sx={{ p: { xs: 1.5, md: 2 }, borderRadius: "100rem", aspectRatio: 1 }}
          variant={!isAudioMuted ? "text" : "contained"}>
          {!isAudioMuted ? <MicIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} /> : <MicOffIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} />}
        </Button>
        <Button
          onClick={() => {
            toggleVideoMute();
          }}
          className="border-2 border-gray-700 border-solid"
          color={!isVideoMuted ? "primary" : "error"}
          sx={{ p: { xs: 1.5, md: 2 }, borderRadius: "100rem", aspectRatio: 1 }}
          variant={!isVideoMuted ? "text" : "contained"}>
          {!isVideoMuted ? <VideocamIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} /> : <VideocamOff fontSize={window.innerWidth > 768 ? "large" : "medium"} />}
        </Button>
        {/* Screen Share Button */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Button onClick={toggleScreenShare} className="border-2 border-gray-700 border-solid" color={isScreenSharing ? "error" : "primary"} sx={{ p: { xs: 1.5, md: 2 }, borderRadius: "100rem", aspectRatio: 1 }} variant={isScreenSharing ? "contained" : "text"}>
            {isScreenSharing ? <StopScreenShareIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} /> : <PresentToAllIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} />}
          </Button>
        </Box>
        {/* Chat Button */}
        <Button onClick={() => setShowChat(!showChat)} className="border-2 border-gray-700 border-solid" sx={{ p: { xs: 1.5, md: 2 }, borderRadius: "100rem", aspectRatio: 1, display: { xs: "none", md: "block" } }}>
          <ChatIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} />
        </Button>
        <Button
          sx={{
            p: { xs: 1.5, md: 2 },
            borderRadius: "100%",
            aspectRatio: 1,
          }}
          color="error"
          onClick={leaveRoom}
          variant="contained">
          <CallEndIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} />
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}>
          <MenuItem
            onClick={() => {
              setShowChat(!showChat);
              handleClose();
            }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ChatIcon />
              <span>Chat</span>
            </Box>
          </MenuItem>
          <MenuItem
            onClick={() => {
              toggleScreenShare();
              handleClose();
            }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isScreenSharing ? <StopScreenShareIcon /> : <PresentToAllIcon />}
              <span>{isScreenSharing ? "Stop sharing" : "Share screen"}</span>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <Settings inMenu={true} />
          </MenuItem>
        </Menu>
        {showChat && <Chat onClose={() => setShowChat(false)} />}
      </Box>
      {/* Settings - only show on desktop */}
      <Box>
        <Button
          onClick={handleClick}
          className="border-2 border-gray-700 border-solid"
          sx={{
            p: { xs: 1.5, md: 2 },
            borderRadius: "100rem",
            aspectRatio: 1,
            display: { xs: "flex", md: "none" }, // Only show on mobile
          }}>
          <MoreVertIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} />
        </Button>
        <Settings inMenu={false} />
      </Box>
    </Box>
  );
}
