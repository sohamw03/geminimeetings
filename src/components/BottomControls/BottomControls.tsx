"use client";

import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { Share, VideocamOff } from "@mui/icons-material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatIcon from "@mui/icons-material/Chat";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PresentToAllIcon from "@mui/icons-material/PresentToAll";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import VideocamIcon from "@mui/icons-material/Videocam";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";
import Chat from "../Chat/Chat";
import ShareModal from "../Share/ShareModal";
import Settings from "./Settings/Settings";

export default function BottomControls() {
  // Global Context
  const { leaveRoom, toggleAudioMute, toggleVideoMute, isAudioMuted, isVideoMuted, isScreenSharing, toggleScreenShare }: Values = useGlobal();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [showChat, setShowChat] = useState(false);
  const [showShare, setShowShare] = useState(false);

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
        <Button onClick={() => setShowShare(true)} sx={{ ml: { xs: 1, md: 3.5 }, p: { xs: 1.5, md: 2 }, borderRadius: "100rem", aspectRatio: 1, border: 2, borderColor: "grey.800" }}>
          <Share fontSize={window.innerWidth > 768 ? "large" : "medium"} />
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
          color={!isAudioMuted ? "primary" : "error"}
          sx={{ p: { xs: 1.5, md: 2 }, borderRadius: "100rem", aspectRatio: 1, border: 2, borderColor: "grey.800" }}
          variant={!isAudioMuted ? "text" : "contained"}>
          {!isAudioMuted ? <MicIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} /> : <MicOffIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} />}
        </Button>
        <Button
          onClick={() => {
            toggleVideoMute();
          }}
          color={!isVideoMuted ? "primary" : "error"}
          sx={{ p: { xs: 1.5, md: 2 }, borderRadius: "100rem", aspectRatio: 1, border: 2, borderColor: "grey.800" }}
          variant={!isVideoMuted ? "text" : "contained"}>
          {!isVideoMuted ? <VideocamIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} /> : <VideocamOff fontSize={window.innerWidth > 768 ? "large" : "medium"} />}
        </Button>
        {/* Screen Share Button */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Button onClick={toggleScreenShare} color={isScreenSharing ? "error" : "primary"} sx={{ p: { xs: 1.5, md: 2 }, borderRadius: "100rem", aspectRatio: 1, border: 2, borderColor: "grey.800" }} variant={isScreenSharing ? "contained" : "text"}>
            {isScreenSharing ? <StopScreenShareIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} /> : <PresentToAllIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} />}
          </Button>
        </Box>
        {/* Chat Button */}
        <Button onClick={() => setShowChat(!showChat)} sx={{ p: { xs: 1.5, md: 2 }, borderRadius: "100rem", aspectRatio: 1, display: { xs: "none", md: "block" }, border: 2, borderColor: "grey.800" }}>
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
      </Box>
      {/* Settings - only show on desktop */}
      <Box>
        <Button
          onClick={handleClick}
          sx={{
            mr: { xs: 1, md: 3.5 },
            p: { xs: 1.5, md: 2 },
            borderRadius: "100rem",
            aspectRatio: 1,
            display: { xs: "flex", md: "none" },
            border: 2,
            borderColor: "grey.800",
          }}>
          <MoreVertIcon fontSize={window.innerWidth > 768 ? "large" : "medium"} />
        </Button>
        <Settings inMenu={false} />
      </Box>
      {/* Detached Full Screen Modals */}
      {showChat && <Chat onClose={() => setShowChat(false)} />}
      <ShareModal open={showShare} onClose={() => setShowShare(false)} />
    </Box>
  );
}
