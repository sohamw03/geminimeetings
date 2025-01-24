"use client";
import useSocket from "@/hooks/useSocket";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";
import { Socket, io } from "socket.io-client";

export interface Values {
  userVideoRef: React.RefObject<HTMLVideoElement | undefined | null>;
  peerVideoRef: React.RefObject<HTMLVideoElement | undefined | null>;
  setRoomName: React.Dispatch<React.SetStateAction<string>>;
  leaveRoom: () => void;
  toggleAudioMute: (options?: { noUIToggle?: boolean }) => void;
  toggleVideoMute: (options?: { noUIToggle?: boolean }) => void;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  audioDevices: { devices: MediaDeviceInfo[] };
  setAudioDevices: React.Dispatch<React.SetStateAction<{ devices: MediaDeviceInfo[] }>>;
  videoDevices: { devices: MediaDeviceInfo[] };
  setVideoDevices: React.Dispatch<React.SetStateAction<{ devices: MediaDeviceInfo[] }>>;
  initOrRefreshMediaStream: (mode: "init" | "refresh", audioDeviceId?: string | null, videoDeviceId?: string | null) => void;
  initSocket: (roomName: string) => void;
  selectedAudioDeviceId: string | null;
  setSelectedAudioDeviceId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedVideoDeviceId: string | null;
  setSelectedVideoDeviceId: React.Dispatch<React.SetStateAction<string | null>>;
}

const globalContext = createContext<Values>({} as Values);

export function GlobalContextProvider({ children }: { children: React.ReactNode }) {
  // Global states
  const [roomName, setRoomName] = useState<string>("");
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [audioDevices, setAudioDevices] = useState<{ devices: MediaDeviceInfo[] }>({ devices: [] });
  const [videoDevices, setVideoDevices] = useState<{ devices: MediaDeviceInfo[] }>({ devices: [] });
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | null>(null);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(null);

  const userVideoRef = useRef<HTMLVideoElement | undefined | null | any>();
  const peerVideoRef = useRef<HTMLVideoElement | undefined | null | any>();
  const socketRef = useRef<Socket>();
  const userStreamRef = useRef<MediaStream>();
  const peerRef = useRef<SimplePeer.Instance>();
  const hostRef = useRef<boolean>(false);

  const toggleAudioMute = (options?: { noUIToggle?: boolean }) => {
    if (userStreamRef.current) {
      userStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      if (!options || options?.noUIToggle === false) {
        setIsAudioMuted(!isAudioMuted);
      }
    }
  };

  const toggleVideoMute = (options?: { noUIToggle?: boolean }) => {
    if (userStreamRef.current) {
      userStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      if (!options || options?.noUIToggle === false) {
        setIsVideoMuted(!isVideoMuted);
      }
    }
  };

  const initOrRefreshMediaStream = (mode: "init" | "refresh", audioDeviceId?: string | null, videoDeviceId?: string | null) => {
    console.log(`func: initOrRefreshMediaStream - mode: ${mode}`);
    console.log(audioDeviceId ? { exact: audioDeviceId } : undefined);
    console.log(videoDeviceId ? { exact: videoDeviceId } : undefined);

    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }

    navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined },
        video: { width: 1280, height: 720, frameRate: 30, deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined },
      })
      .then((stream) => {
        userStreamRef.current = stream;

        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          userVideoRef.current.onloadedmetadata = () => {
            userVideoRef.current?.play();
          };
        }

        if (mode === "refresh" && peerRef.current) {
          // Get all existing senders in the peer connection
          const peerConnection = (peerRef.current as any)._pc;
          const senders = peerConnection.getSenders();

          // Replace tracks for each sender
          stream.getTracks().forEach((track) => {
            const sender = senders.find((s: any) => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track).catch((err: any) => console.error("Error replacing track:", err));
            }
          });

          // Update the peer's stream
          peerRef.current.streams[0] = stream;

          // Retain audio/video mute status
          if (isAudioMuted) {
            toggleAudioMute({ noUIToggle: true });
          }
          if (isVideoMuted) {
            toggleVideoMute({ noUIToggle: true });
          }
        }
      })
      .catch((err) => console.error(err));
  };

  // Get the list of audio and video devices on load
  const listDevices = async () => {
    console.log("Enumerating devices");
    if (!navigator.mediaDevices?.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
    } else {
      let localAudioDevices: { devices: MediaDeviceInfo[] } = { devices: [] };
      let localVideoDevices: { devices: MediaDeviceInfo[] } = { devices: [] };

      // List cameras and microphones.
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          devices.forEach((device) => {
            if (device.kind === "audioinput") {
              localAudioDevices.devices.push(device);
            } else if (device.kind === "videoinput") {
              localVideoDevices.devices.push(device);
            }
          });
          // Set initial selected device IDs if not already set
          if (!selectedAudioDeviceId && localAudioDevices.devices.length > 0) {
            setSelectedAudioDeviceId(localAudioDevices.devices[0].deviceId);
          }
          if (!selectedVideoDeviceId && localVideoDevices.devices.length > 0) {
            setSelectedVideoDeviceId(localVideoDevices.devices[0].deviceId);
          }
          setAudioDevices({ devices: localAudioDevices.devices });
          setVideoDevices({ devices: localVideoDevices.devices });
          console.log({ localAudioDevices, localVideoDevices });
        })
        .catch((err) => {
          console.error(`${err.name}: ${err.message}`);
        });
    }
  };

  useEffect(() => {
    listDevices();
  }, [open]);

  useEffect(() => {
    navigator.mediaDevices.addEventListener("devicechange", () => {
      listDevices();
    });
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", () => {
        listDevices();
      });
    };
  }, []);

  useSocket();

  const initSocket = (localRoomName: string) => {
    console.log("func: Initiating socket connection");
    setRoomName(localRoomName);

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = undefined;
    }

    // Create new socket connection
    socketRef.current = io(`${process.env.NEXT_PUBLIC_WS_HOST}`, {
      path: "/api/socket/",
      forceNew: true,
    });

    // Reset state
    hostRef.current = false;
    if (peerRef.current) {
      cleanupPeerConnection();
    }

    // First when we join the room
    console.log({ localRoomName });
    socketRef.current.emit("join", localRoomName);

    socketRef.current.on("created", ({ isHost }) => {
      hostRef.current = isHost;
      initOrRefreshMediaStream("init");
    });

    socketRef.current.on("joined", ({ isHost }) => {
      hostRef.current = isHost;
      initOrRefreshMediaStream("init");
      socketRef.current?.emit("ready", localRoomName);
    });

    socketRef.current.on("host_changed", ({ isHost }) => {
      console.log("Became host:", isHost);
      hostRef.current = isHost;
    });

    socketRef.current.on("ready", () => {
      if (hostRef.current && userStreamRef.current) {
        peerRef.current = new SimplePeer({ initiator: true, stream: userStreamRef.current, trickle: false });

        peerRef.current.on("signal", (data) => {
          socketRef.current?.emit("offer", data, localRoomName);
        });

        peerRef.current.on("stream", (stream) => {
          if (peerVideoRef.current) {
            peerVideoRef.current.srcObject = stream;
          }
        });
      }
    });

    socketRef.current.on("offer", (offer) => {
      if (!hostRef.current && userStreamRef.current) {
        peerRef.current = new SimplePeer({ initiator: false, stream: userStreamRef.current, trickle: false });

        peerRef.current.on("signal", (data) => {
          socketRef.current?.emit("answer", data, localRoomName);
        });

        peerRef.current.on("stream", (stream) => {
          if (peerVideoRef.current) {
            peerVideoRef.current.srcObject = stream;
          }
        });

        peerRef.current.signal(offer);
      }
    });

    socketRef.current.on("answer", (answer) => {
      peerRef.current?.signal(answer);
    });

    socketRef.current.on("leave", () => {
      hostRef.current = true;
      cleanupPeerConnection();
    });

    socketRef.current.on("full", () => {
      window.location.href = "/";
    });
  };

  const cleanupPeerConnection = () => {
    if (peerRef.current) {
      peerRef.current.removeAllListeners();
      peerRef.current.destroy();
      peerRef.current = undefined;
    }

    if (peerVideoRef.current?.srcObject) {
      const stream = peerVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        track.stop();
        stream.removeTrack(track);
      });
      peerVideoRef.current.srcObject = null;
    }
  };

  const leaveRoom = () => {
    // First notify others we're leaving
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave", roomName);
    }

    // Cleanup user media
    if (userVideoRef.current?.srcObject) {
      const stream = userVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        track.stop();
        stream.removeTrack(track);
      });
      userVideoRef.current.srcObject = null;
      userStreamRef.current = undefined;
    }

    // Cleanup peer connection
    cleanupPeerConnection();

    // Reset states
    setRoomName("");
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    hostRef.current = false;

    // Cleanup socket
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = undefined;
    }

    window.location.assign("/");
  };

  const values: Values = {
    userVideoRef,
    peerVideoRef,
    setRoomName,
    leaveRoom,
    toggleAudioMute,
    toggleVideoMute,
    isAudioMuted,
    isVideoMuted,
    open,
    setOpen,
    audioDevices,
    setAudioDevices,
    videoDevices,
    setVideoDevices,
    initOrRefreshMediaStream,
    initSocket,
    selectedAudioDeviceId,
    setSelectedAudioDeviceId,
    selectedVideoDeviceId,
    setSelectedVideoDeviceId,
  };

  return <globalContext.Provider value={values}>{children}</globalContext.Provider>;
}

export function useGlobal() {
  return useContext(globalContext);
}
