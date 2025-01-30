"use client";

import Navbar from "@/components/Navbar";
import { Box, Button, Card, TextField, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useGlobal } from "@/globalContext/GlobalContext";

export default function HomeContent() {
  const searchParams = useSearchParams();
  const { setUsername } = useGlobal();

  const router = useRouter();
  const [roomName, setRoomName] = useState(searchParams.get("id") || "");
  const [actionText, setActionText] = useState("Create Room");
  const [name, setName] = useState("");

  const joinRoom = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    setUsername(name.trim());
    const ruid = (len: number) =>
      Math.random()
        .toString(36)
        .slice(3, 3 + len);
    const generateUid = `${ruid(3)}-${ruid(4)}-${ruid(3)}`;
    router.push(`/room/${roomName || generateUid}`);
  };

  useEffect(() => {
    if (roomName) {
      setActionText("Join Room");
    } else {
      setActionText("Create Room");
    }
  }, [roomName]);

  return (
    <Card className="flex flex-col h-screen pt-[5vh] md:pt-[10vh]">
      <Navbar />
      <Box component={"main"} sx={{ margin: "10vh auto 0", px: 2, maxWidth: { xs: "100%", sm: "80%", md: "sm" } }}>
        <Typography
          variant="h2"
          component={"h1"}
          sx={{
            textAlign: "center",
            userSelect: "none",
            fontWeight: "bold",
            fontSize: { xs: "2rem", sm: "3rem", md: "3.75rem" },
          }}>
          Welcome to GeminiMeetings
        </Typography>
        <Box
          component={"form"}
          sx={{
            display: "flex",
            flexDirection: "column",
            margin: "2rem auto",
            gap: "1rem",
            justifyContent: "center",
            alignItems: "center",
          }}
          onSubmit={joinRoom}>
          <TextField
            required
            onChange={(e) => setName(e.target.value)}
            value={name}
            label="Enter your name"
            variant="outlined"
            type="text"
            sx={{
              width: { xs: "100%", sm: "30rem" },
            }}
          />
          <TextField
            onChange={(e) => setRoomName(e.target.value)}
            value={roomName}
            label="Enter a code to join"
            variant="outlined"
            type="search"
            sx={{
              width: { xs: "100%", sm: "30rem" },
            }}
          />
          <Button
            variant="contained"
            type="submit"
            size="large"
            sx={{
              width: { xs: "100%", sm: "30rem" },
            }}>
            <span className="normal-case text-lg">{actionText}</span>
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
