"use client";

import Navbar from "@/components/Navbar";
import { Box, Button, Card, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");

  const joinRoom = (e: FormEvent) => {
    e.preventDefault();
    // window.location.assign(`/room/${roomName || Math.random().toString(36).slice(2)}`);
    router.push(`/room/${roomName || Math.random().toString(36).slice(2)}`);
  };

  return (
    <Card className="flex flex-col h-screen pt-[10vh]">
      <Navbar />
      <Box component={"main"} maxWidth={"sm"} sx={{ margin: "calc(15vh) auto" }}>
        <Typography variant="h2" component={"h1"} sx={{ textAlign: "center", userSelect: "none", fontWeight: "bold" }}>
          Welcome to GeminiMeetings
        </Typography>
        <Box component={"form"} sx={{ display: "flex", margin: "2rem auto", gap: "1rem", justifyContent: "center" }} onSubmit={joinRoom}>
          <TextField onChange={(e) => setRoomName(e.target.value)} value={roomName} label="Enter a code to generate or join" variant="outlined" sx={{ width: "30rem", marginLeft: "6rem" }} />
          <Button variant="text" type="submit" size="large" sx={{ width: "6rem" }}>
            Join
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
