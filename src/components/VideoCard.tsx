import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { Paper } from "@mui/material";
import { LegacyRef } from "react";

export default function VideoCard({ mode }: { mode: "user" | "peer" }) {
  // Global Context
  const { userVideoRef, peerVideoRef }: Values = useGlobal();

  switch (mode) {
    case "user":
      return (
        <Paper elevation={3} className="fixed bottom-36 right-8 rounded-xl cursor-pointer w-[25rem] aspect-video">
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
        <>
          <Paper elevation={1} className="mb-32 rounded-xl cursor-pointer w-full h-full flex justify-center">
            <video autoPlay playsInline controls={false} ref={peerVideoRef as LegacyRef<HTMLVideoElement>} className="aspect-video rounded-xl" />
          </Paper>
        </>
      );
  }
}
