import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { Paper } from "@mui/material";
import { LegacyRef } from "react";

export default function VideoCard({ mode }: { mode: "user" | "peer" }) {
  // Global Context
  const { userVideoRef, peerVideoRef }: Values = useGlobal();

  switch (mode) {
    case "user":
      return (
        <Paper elevation={3} className="fixed bottom-36 right-4 md:right-4 rounded-xl cursor-pointer w-[40vw] md:w-[25rem] aspect-video z-10">
          <video
            autoPlay
            playsInline
            controls={false}
            ref={userVideoRef as LegacyRef<HTMLVideoElement>}
            className="aspect-video w-full h-full rounded-xl"
            muted
          />
        </Paper>
      );
    case "peer":
      return (
        <Paper elevation={2} className="rounded-xl cursor-pointer w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] flex justify-center items-center">
          <video autoPlay playsInline controls={false} ref={peerVideoRef as LegacyRef<HTMLVideoElement>} className="aspect-video h-full w-full" />
        </Paper>
      );
  }
}
