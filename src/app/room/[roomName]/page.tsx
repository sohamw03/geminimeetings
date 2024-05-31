"use client";

import BottomControls from "@/components/BottomControls/BottomControls";
import VideoCard from "@/components/VideoCard";
import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { Box, SxProps } from "@mui/material";
import { LegacyRef, useEffect } from "react";

export default function Room({ params }: { params: { roomname: string } }) {
  const { roomname } = params;

  // Global Context
  const { peerVideoRef, setRoomName }: Values = useGlobal();

  useEffect(() => {
    setRoomName((p) => roomname);
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
