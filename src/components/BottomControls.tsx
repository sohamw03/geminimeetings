"use client";

import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { VideocamOff } from "@mui/icons-material";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import { Box, Button } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ShieldIcon from "@mui/icons-material/Shield";

export default function BottomControls() {
  // Global Context
  const { leaveRoom, toggleAudioMute, toggleVideoMute, isAudioMuted, isVideoMuted }: Values = useGlobal();

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        gap: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        zIndex: 999,
      }}>
      {/* Placeholder (Left) */}
      <Box>
        <Button
          disabled
          sx={{
            ml: 3.5,
          }}>
          <ShieldIcon fontSize="large" />
        </Button>
      </Box>
      {/* Media Controls (Center) */}
      <Box
        sx={{
          gap: "1rem",
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
          sx={{ p: 2, borderRadius: "100%" }}
          variant={!isAudioMuted ? "text" : "contained"}>
          {!isAudioMuted ? <MicIcon fontSize="large" /> : <MicOffIcon fontSize="large" />}
        </Button>
        <Button
          onClick={() => {
            toggleVideoMute();
          }}
          className="border-2 border-gray-700 border-solid"
          color={!isVideoMuted ? "primary" : "error"}
          sx={{ p: 2, borderRadius: "100%" }}
          variant={!isVideoMuted ? "text" : "contained"}>
          {!isVideoMuted ? <VideocamIcon fontSize="large" /> : <VideocamOff fontSize="large" />}
        </Button>
        <Button
          sx={{
            p: 2,
            borderRadius: "100%",
          }}
          color="error"
          onClick={leaveRoom}
          variant="contained">
          <CallEndIcon fontSize="large" />
        </Button>
      </Box>
      {/* Settings (Right) */}
      <Box>
        <Button
          sx={{
            p: 2,
            mr: 3.5,
            borderRadius: "100%",
          }}
          className="border-2 border-gray-700 border-solid">
          <SettingsIcon fontSize="large" />
        </Button>
      </Box>
    </Box>
  );
}
