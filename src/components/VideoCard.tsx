"use client";
import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { Fullscreen, FullscreenExit } from "@mui/icons-material";
import { CircularProgress, IconButton, Paper, Typography } from "@mui/material";
import { LegacyRef, useEffect, useRef, useState } from "react";

export default function VideoCard({ mode }: { mode: "user" | "peer" }) {
  const { userVideoRef, peerVideoRef, isPeerScreenSharing, username, peerUsername, isWebRTCConnecting, videoDevices, selectedVideoDeviceId }: Values = useGlobal();
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const shouldMirror = videoDevices?.devices
    .find((device) => device.deviceId === selectedVideoDeviceId)
    ?.label.toLowerCase()
    .includes("front") || window.innerWidth > 600;

  const showControls = () => {
    setIsControlsVisible(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
  };

  const hideControls = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsControlsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const toggleFullScreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        console.log("toggling fullscreen on");
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        console.log("toggling fullscreen off");
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  const FullscreenButton = () => (
    <IconButton
      sx={{
        position: "absolute",
        top: "0.5rem",
        right: "0.5rem",
        backgroundColor: "rgba(0,0,0,0.5)",
        color: "white",
        "&:hover": {
          backgroundColor: "rgba(0,0,0,0.7)",
        },
        opacity: isControlsVisible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
      onClick={toggleFullScreen}>
      {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
    </IconButton>
  );

  const UsernameOverlay = ({ name }: { name: string }) => (
    <Typography
      sx={{
        position: "absolute",
        bottom: "0.5rem",
        left: "0.5rem",
        color: "white",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: "0.25rem 0.5rem",
        borderRadius: "4px",
        fontSize: "0.875rem",
      }}>
      {name}
    </Typography>
  );

  const videoEvents = {
    onMouseEnter: showControls,
    onMouseLeave: hideControls,
    onMouseMove: showControls,
    onTouchStart: showControls,
  };

  switch (mode) {
    case "user":
      return (
        <Paper ref={containerRef} elevation={3} className="fixed bottom-[9.15rem] right-4 md:right-4 rounded-lg cursor-pointer w-[40vw] md:w-[25rem] aspect-video overflow-hidden z-10" {...videoEvents}>
          <video autoPlay playsInline controls={false} ref={userVideoRef as LegacyRef<HTMLVideoElement>} className={`aspect-video w-full h-full ${shouldMirror ? "-scale-x-100" : ""}`} muted />
          <UsernameOverlay name={username || "You"} />
          <FullscreenButton />
        </Paper>
      );
    case "peer":
      return (
        <Paper ref={containerRef} elevation={2} className="rounded-xl cursor-pointer w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] flex justify-center items-center relative" {...videoEvents}>
          {isWebRTCConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <CircularProgress />
            </div>
          )}
          <video autoPlay playsInline controls={false} ref={peerVideoRef as LegacyRef<HTMLVideoElement>} className={`aspect-video h-full w-full`} />
          <UsernameOverlay name={peerUsername || "Peer"} />
          <FullscreenButton />
        </Paper>
      );
  }
}
