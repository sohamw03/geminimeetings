"use client";
import { Values, useGlobal } from "@/globalContext/GlobalContext";
import { Fullscreen, FullscreenExit } from "@mui/icons-material";
import { CircularProgress, IconButton, Paper, Typography } from "@mui/material";
import { LegacyRef, useEffect, useLayoutEffect, useRef, useState } from "react";

export default function VideoCard({ mode }: { mode: "user" | "peer" }) {
  // ===== Context =====
  const { userVideoRef, peerVideoRef, username, peerUsername, isWebRTCConnecting, videoDevices, selectedVideoDeviceId }: Values = useGlobal();

  // ===== Constants / config =====
  const EDGE_MARGIN = 16;
  const CONTROLS_HEIGHT = 8 * 16; // 8rem reserved area for bottom controls
  const BOTTOM_GAP = 16; // visual gap above controls
  const BOTTOM_SAFE_OFFSET = CONTROLS_HEIGHT + BOTTOM_GAP;
  const FLICK_VELOCITY_THRESHOLD = 300; // px per ms threshold for flick bias

  // ===== State =====
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [side, setSide] = useState<"left" | "right">("right");
  const [top, setTop] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragLeft, setDragLeft] = useState<number | null>(null);

  // ===== Refs =====
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();
  const sizeRef = useRef({ width: 0, height: 0 });
  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    lastX: 0,
    lastY: 0,
    lastMoveAt: 0,
  });
  // Store position before entering fullscreen so we can restore
  const preFullscreenRef = useRef<{ top: number } | null>(null);
  const pendingRef = useRef(false);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // ===== Derived =====
  const shouldMirror =
    videoDevices?.devices
      .find((device) => device.deviceId === selectedVideoDeviceId)
      ?.label.toLowerCase()
      .includes("front") || window.innerWidth > 600;

  // ===== Control visibility helpers =====
  const showControls = () => {
    setIsControlsVisible(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => setIsControlsVisible(false), 3000);
  };
  const hideControls = () => {
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    setIsControlsVisible(false);
  };
  useEffect(() => () => hideControlsTimeout.current && clearTimeout(hideControlsTimeout.current), []);

  // ===== Fullscreen handling =====
  const toggleFullScreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        // entering
        preFullscreenRef.current = { top };
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
      else if (document.fullscreenElement === containerRef.current) setIsFullscreen(true);
      // If we've exited fullscreen (no element OR element is not ours) restore stored top
      if (!document.fullscreenElement && preFullscreenRef.current) {
        const stored = preFullscreenRef.current.top;
        if (typeof window !== "undefined") {
          const maxTop = window.innerHeight - sizeRef.current.height - BOTTOM_SAFE_OFFSET;
          const restored = Math.min(Math.max(EDGE_MARGIN, stored), maxTop);
          setTop(restored);
        } else {
          setTop(stored);
        }
        preFullscreenRef.current = null;
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const FullscreenButton = () => (
    <IconButton
      data-no-drag="true"
      sx={{
        position: "absolute",
        top: "0.5rem",
        right: "0.5rem",
        backgroundColor: "rgba(0,0,0,0.5)",
        color: "white",
        "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
        opacity: isControlsVisible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
      onClick={(e) => {
        e.stopPropagation();
        toggleFullScreen();
      }}>
      {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
    </IconButton>
  );

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

  const videoEvents = {
    onMouseEnter: showControls,
    onMouseLeave: hideControls,
    onMouseMove: showControls,
    onTouchStart: showControls,
  };

  // ===== Drag logic (user video only) =====
  const isUser = mode === "user";

  // Initial measure & placement
  useLayoutEffect(() => {
    if (!isUser || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    sizeRef.current = { width: rect.width, height: rect.height };
    if (top === 0 && typeof window !== "undefined") {
      const initialTop = Math.max(EDGE_MARGIN, window.innerHeight - rect.height - BOTTOM_SAFE_OFFSET);
      setTop(initialTop);
    }
  }, [isUser]);

  // Resize clamp
  useEffect(() => {
    if (!isUser) return;
    const onResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
      setTop((prev) => clampTop(prev));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isUser]);

  const clampTop = (value: number) => {
    if (typeof window === "undefined") return value;
    const maxTop = window.innerHeight - sizeRef.current.height - BOTTOM_SAFE_OFFSET;
    return Math.min(Math.max(EDGE_MARGIN, value), maxTop);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!pendingRef.current && !draggingRef.current) return;
    const ds = dragStateRef.current;
    ds.lastX = e.clientX;
    ds.lastY = e.clientY;
    ds.lastMoveAt = performance.now();
    if (!draggingRef.current) {
      draggingRef.current = true;
      setDragging(true);
    }
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    const nextLeft = ds.startLeft + dx;
    const nextTop = clampTop(ds.startTop + dy);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!draggingRef.current) return;
      setDragLeft(nextLeft);
      setTop(nextTop);
    });
    e.preventDefault();
  };

  const endDrag = (e?: PointerEvent) => {
    const ds = dragStateRef.current;
    if (e) {
      ds.lastX = e.clientX;
      ds.lastY = e.clientY;
    }
    const now = performance.now();
    const moved = ds.lastX !== ds.startX || ds.lastY !== ds.startY;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if ((draggingRef.current || (pendingRef.current && moved)) && typeof window !== "undefined") {
      const dt = Math.max(1, now - ds.lastMoveAt);
      const dxTotal = ds.lastX - ds.startX;
      const velocityX = dxTotal / dt;
      const tentativeLeft = ds.startLeft + dxTotal;
      const cardWidth = sizeRef.current.width || (containerRef.current?.getBoundingClientRect().width ?? 0);
      const centerX = tentativeLeft + cardWidth / 2;
      let target: "left" | "right" = centerX < window.innerWidth / 2 ? "left" : "right";
      if (Math.abs(velocityX) > FLICK_VELOCITY_THRESHOLD) target = velocityX < 0 ? "left" : "right";
      setSide(target);
    }
    pendingRef.current = false;
    draggingRef.current = false;
    setDragging(false);
    setDragLeft(null);
    window.removeEventListener("pointermove", handlePointerMove as any);
    window.removeEventListener("pointerup", endDrag as any);
    window.removeEventListener("pointercancel", endDrag as any);
  };

  const startDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (!isUser || isFullscreen || !containerRef.current) return;
    if ((e.target as Element).closest('[data-no-drag="true"]')) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      lastX: e.clientX,
      lastY: e.clientY,
      lastMoveAt: performance.now(),
    };
    pendingRef.current = true;
    draggingRef.current = false;
    setDragLeft(rect.left);
    window.addEventListener("pointermove", handlePointerMove as any, { passive: false });
    window.addEventListener("pointerup", endDrag as any);
    window.addEventListener("pointercancel", endDrag as any);
  };

  const computedLeft = (() => {
    if (!isUser) return undefined;
    if (dragLeft !== null) return dragLeft;
    if (typeof window === "undefined") return undefined;
    const w = sizeRef.current.width || containerRef.current?.getBoundingClientRect().width || 0;
    return side === "left" ? EDGE_MARGIN : window.innerWidth - w - EDGE_MARGIN;
  })();

  const userPositioning = isUser
    ? {
        style: {
          position: "fixed" as const,
          top: `${top}px`,
          left: computedLeft !== undefined ? `${computedLeft}px` : undefined,
          zIndex: 10,
          transition: dragging ? "none" : "left 0.3s ease, top 0.25s ease",
          cursor: isFullscreen ? "auto" : dragging ? "grabbing" : "grab",
          touchAction: "none" as const,
        },
        onPointerDown: startDrag,
      }
    : {};

  switch (mode) {
    case "user":
      return (
        <Paper ref={containerRef} elevation={3} className="rounded-lg overflow-hidden w-[40vw] md:w-[25rem] aspect-video" {...videoEvents} {...userPositioning}>
          <video autoPlay playsInline controls={false} ref={userVideoRef as LegacyRef<HTMLVideoElement>} className={`aspect-video w-full h-full ${shouldMirror ? "-scale-x-100" : ""}`} muted />
          <UsernameOverlay name={username || "You"} />
          <FullscreenButton />
        </Paper>
      );
    case "peer":
      return (
        <Paper ref={containerRef} elevation={2} className="rounded-xl cursor-pointer w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] flex justify-center items-center relative" {...videoEvents}>
          {isWebRTCConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <CircularProgress />
            </div>
          )}
          <video autoPlay playsInline controls={false} ref={peerVideoRef as LegacyRef<HTMLVideoElement>} className={`aspect-video h-full w-full`} />
          <UsernameOverlay name={peerUsername || "Peer"} />
          <FullscreenButton />
        </Paper>
      );
  }
}
