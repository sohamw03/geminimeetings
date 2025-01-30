import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { Paper, Typography } from "@mui/material";
import { LegacyRef } from "react";

export default function VideoCard({ mode }: { mode: "user" | "peer" }) {
  const { userVideoRef, peerVideoRef, isPeerScreenSharing, username, peerUsername }: Values = useGlobal();

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

  switch (mode) {
    case "user":
      return (
        <Paper elevation={3} className="fixed bottom-[9.15rem] right-4 md:right-4 rounded-lg cursor-pointer w-[40vw] md:w-[25rem] aspect-video overflow-hidden z-10">
          <video autoPlay playsInline controls={false} ref={userVideoRef as LegacyRef<HTMLVideoElement>} className="aspect-video w-full h-full -scale-x-100" muted />
          <UsernameOverlay name={username || "You"} />
        </Paper>
      );
    case "peer":
      return (
        <Paper elevation={2} className="rounded-xl cursor-pointer w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] flex justify-center items-center relative">
          <video autoPlay playsInline controls={false} ref={peerVideoRef as LegacyRef<HTMLVideoElement>} className={`aspect-video h-full w-full ${isPeerScreenSharing ? "" : "-scale-x-100"}`} />
          <UsernameOverlay name={peerUsername || "Peer"} />
        </Paper>
      );
  }
}
