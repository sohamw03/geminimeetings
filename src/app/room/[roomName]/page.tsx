"use client";

import BottomControls from "@/components/BottomControls/BottomControls";
import VideoCard from "@/components/VideoCard";
import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { Box, SxProps } from "@mui/material";
import { useEffect } from "react";

export default function Room({ params }: { params: { roomName: string } }) {
  const { roomName } = params;

  // Global Context
  const { initSocket }: Values = useGlobal();

  useEffect(() => {
    initSocket(roomName);
  }, []);

  return (
    <Box sx={styles.main}>
      <Box sx={styles.videoContainer}>
        <VideoCard mode="peer" />
      </Box>
      <VideoCard mode="user" />
      <BottomControls />
    </Box>
  );
}

const styles: { [key: string]: SxProps } = {
  main: {
    width: "100%",
    height: "100svh",
    display: "grid",
    gridTemplateRows: "1fr 8rem",
    gridTemplateColumns: "1fr",
    position: "relative",
  },
  videoContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
};
