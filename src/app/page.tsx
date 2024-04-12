"use client";

import { Box, Button, Card, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");

  const joinRoom = () => {
    router.push(`/room/${roomName || Math.random().toString(36).slice(2)}`);
  };

  return (
    <Card className="flex flex-col h-screen pt-[10vh]">
      <Box component={"main"} maxWidth={"sm"} sx={{ margin: "4rem auto" }}>
        <Typography variant="h2" component={"h1"} sx={{ textAlign: "center", userSelect: "none", fontWeight: "bold" }}>
          Welcome to GeminiMeetings
        </Typography>
        <Box component={"div"} sx={{ display: "flex", margin: "2rem auto", gap: "1rem", justifyContent: "center" }}>
          <TextField onChange={(e) => setRoomName(e.target.value)} value={roomName} label="Enter a code to generate or join" variant="outlined" />
          <Button variant="text" onClick={joinRoom} size="large" sx={{ width: "6rem" }}>
            Join
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
