"use client";

import HomeContent from "@/components/HomeContent";
import { Box, Fade } from "@mui/material";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "black",
          }}
        />
      }>
      <Fade in timeout={1000}>
        <Box>
          <HomeContent />
        </Box>
      </Fade>
    </Suspense>
  );
}
