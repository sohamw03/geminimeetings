"use client";

import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { VideocamOff } from "@mui/icons-material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import { Box, Button, Modal } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ShieldIcon from "@mui/icons-material/Shield";
import { useState } from "react";
import Settings from "./Settings/Settings";

export default function BottomControls() {
  // Global Context
  const { leaveRoom, toggleAudioMute, toggleVideoMute, isAudioMuted, isVideoMuted }: Values = useGlobal();

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
            display: { md: 'flex' }
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
      </Box>
      {/* Settings (Right) */}
      <Box>
        <Settings />
      </Box>
    </Box>
  );
}
