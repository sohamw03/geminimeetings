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
    <Card className="flex flex-col h-screen pt-[5vh] md:pt-[10vh]">
      <Navbar />
      <Box component={"main"} sx={{ margin: "10vh auto 0", px: 2, maxWidth: { xs: '100%', sm: '80%', md: 'sm' } }}>
        <Typography variant="h2" component={"h1"} sx={{
          textAlign: "center",
          userSelect: "none",
          fontWeight: "bold",
          fontSize: { xs: '2rem', sm: '3rem', md: '3.75rem' }
        }}>
          Welcome to GeminiMeetings
        </Typography>
        <Box
          component={"form"}
          sx={{
            display: "flex",
            flexDirection: { xs: 'column', sm: 'row' },
            margin: "2rem auto",
            gap: "1rem",
            justifyContent: "center",
            alignItems: "center"
          }}
          onSubmit={joinRoom}
        >
          <TextField
            onChange={(e) => setRoomName(e.target.value)}
            value={roomName}
            label="Enter a code to generate or join"
            variant="outlined"
            sx={{
              width: { xs: '100%', sm: '30rem' },
              marginLeft: { xs: 0, sm: '6rem' }
            }}
          />
          <Button
            variant="text"
            type="submit"
            size="large"
            sx={{
              width: { xs: '100%', sm: '6rem' }
            }}
          >
            Join
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
