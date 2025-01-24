"use client";

import BottomControls from "@/components/BottomControls/BottomControls";
import VideoCard from "@/components/VideoCard";
import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { Box, SxProps } from "@mui/material";
import { useEffect } from "react"

export default function Room({ params }: { params: { roomName: string } }) {
  const { roomName } = params;

  // Global Context
  const { initSocket }: Values = useGlobal();

  useEffect(() => {
    initSocket(roomName);
  }, []);

  return (
    <Box sx={styles.main}>
      <VideoCard mode="user" />
      <VideoCard mode="peer" />
      <BottomControls />
    </Box>
  );
}

const styles: { [key: string]: SxProps } = {
  main: {
    width: "100%",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "start",
    alignItems: "center",
  },
};
