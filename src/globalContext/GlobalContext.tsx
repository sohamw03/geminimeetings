"use client";
import useSocket from "@/hooks/useSocket";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";
import { Socket, io } from "socket.io-client";
import { ChatEngine, Message } from "./ChatEngine";
import { useRouter } from "next/navigation";

export interface Values {
  userVideoRef: React.RefObject<HTMLVideoElement | undefined | null>;
  peerVideoRef: React.RefObject<HTMLVideoElement | undefined | null>;
  setRoomName: React.Dispatch<React.SetStateAction<string>>;
  leaveRoom: () => void;
  toggleAudioMute: (options?: { noUIToggle?: boolean; forceState?: boolean }) => void;
  toggleVideoMute: (options?: { noUIToggle?: boolean; forceState?: boolean }) => void;
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
  isScreenSharing: boolean;
  isPeerScreenSharing: boolean; // Add this line
  toggleScreenShare: () => Promise<void>;
  messages: Array<{ type: "text" | "file"; content: string; sender: "me" | "peer"; fileName?: string }>;
  sendMessage: (message: string) => void;
  sendFile: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  peerUsername: string;
  setPeerUsername: React.Dispatch<React.SetStateAction<string>>;
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPeerScreenSharing, setIsPeerScreenSharing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>("");
  const [peerUsername, setPeerUsername] = useState<string>("");

  const router = useRouter();
  const chatEngineRef = useRef<ChatEngine>();

  const userVideoRef = useRef<HTMLVideoElement | undefined | null | any>();
  const peerVideoRef = useRef<HTMLVideoElement | undefined | null | any>();
  const socketRef = useRef<Socket>();
  const userStreamRef = useRef<MediaStream>();
  const peerRef = useRef<SimplePeer.Instance>();
  const hostRef = useRef<boolean>(false);
  const screenStreamRef = useRef<MediaStream>();
  const wasVideoEnabledBeforeScreenShare = useRef<boolean>(false); // Add this line

  const toggleAudioMute = (options?: { noUIToggle?: boolean; forceState?: boolean }) => {
    if (userStreamRef.current) {
      const newState = options?.forceState !== undefined ? !options.forceState : !userStreamRef.current.getAudioTracks()[0].enabled;
      userStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = newState;
      });
      if (!options || options?.noUIToggle === false) {
        setIsAudioMuted(!newState);
      }
    }
  };

  const toggleVideoMute = (options?: { noUIToggle?: boolean; forceState?: boolean }) => {
    if (userStreamRef.current) {
      const newState = options?.forceState !== undefined ? !options.forceState : !userStreamRef.current.getVideoTracks()[0].enabled;
      userStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = newState;
      });
      if (!options || options?.noUIToggle === false) {
        setIsVideoMuted(!newState);
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
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, voiceIsolation: true, deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined } as any,
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
      console.log("Joined room as:", isHost ? "host" : "peer");
      hostRef.current = isHost;
      initOrRefreshMediaStream("init");
      // Emit ready after media stream is initialized
      setTimeout(() => {
        socketRef.current?.emit("ready", localRoomName);
      }, 1000);
    });

    socketRef.current.on("host_changed", ({ isHost }) => {
      console.log("Became host:", isHost);
      hostRef.current = isHost;
    });

    const setupPeerEventHandlers = (peer: SimplePeer.Instance) => {
      // Initialize ChatEngine first
      chatEngineRef.current = new ChatEngine(peer, setMessages);

      peer.on("data", (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === "screenShare") {
          setIsPeerScreenSharing(message.isScreenSharing);
        } else if (message.type === "username") {
          setPeerUsername(message.username);
        } else {
          chatEngineRef.current?.handleIncomingData(data.toString());
        }
      });

      peer.on("stream", (stream) => {
        if (peerVideoRef.current) {
          peerVideoRef.current.srcObject = stream;
        }
      });

      return peer;
    };

    socketRef.current.on("ready", () => {
      console.log("Ready event received, hostRef:", hostRef.current);
      if (hostRef.current && userStreamRef.current) {
        console.log("Creating peer as initiator");
        if (peerRef.current) {
          peerRef.current.destroy();
        }

        peerRef.current = new SimplePeer({
          initiator: true,
          stream: userStreamRef.current,
          trickle: false,
        });

        setupPeerEventHandlers(peerRef.current);

        peerRef.current.on("signal", (data) => {
          console.log("Host sending offer");
          socketRef.current?.emit("offer", data, localRoomName);
        });

        peerRef.current?.on("connect", () => {
          peerRef.current?.send(JSON.stringify({ type: "username", username }));
        });
      } else if (!hostRef.current && userStreamRef.current) {
        console.log("Non-host peer is ready to receive offer");
      }
    });

    socketRef.current.on("offer", (offer) => {
      console.log("Received offer, creating peer");
      if (!hostRef.current && userStreamRef.current) {
        if (peerRef.current) {
          peerRef.current.destroy();
        }

        peerRef.current = new SimplePeer({
          initiator: false,
          stream: userStreamRef.current,
          trickle: false,
        });

        setupPeerEventHandlers(peerRef.current);

        peerRef.current.on("signal", (data) => {
          console.log("Peer sending answer");
          socketRef.current?.emit("answer", data, localRoomName);
        });

        peerRef.current.signal(offer);

        peerRef.current?.on("connect", () => {
          peerRef.current?.send(JSON.stringify({ type: "username", username }));
        });
      }
    });

    socketRef.current.on("answer", (answer) => {
      console.log("Received answer, signaling peer");
      peerRef.current?.signal(answer);
    });

    socketRef.current.on("leave", () => {
      hostRef.current = true;
      cleanupPeerConnection();
    });

    socketRef.current.on("full", () => {
      router.replace("/");
    });
  };

  const cleanupPeerConnection = () => {
    if (peerRef.current) {
      chatEngineRef.current?.cleanup(); // Add cleanup call
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
    chatEngineRef.current?.cleanup(); // Add cleanup call
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

    // Cleanup screen sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = undefined;
    }
    setIsScreenSharing(false);

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

    router.replace("/");
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);

        // Store current video state before muting
        wasVideoEnabledBeforeScreenShare.current = userStreamRef.current?.getVideoTracks()[0]?.enabled || false;

        // Force mute the video (true = muted)
        toggleVideoMute({ forceState: true, noUIToggle: false });

        // Handle stream ending (user clicks "Stop Sharing")
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = undefined;
          }

          // Restore original video state
          if (wasVideoEnabledBeforeScreenShare.current) {
            toggleVideoMute({ forceState: false, noUIToggle: false });
          }

          // Replace screen share track with original video track in peer connection
          if (peerRef.current && userStreamRef.current) {
            const peerConnection = (peerRef.current as any)._pc;
            const senders = peerConnection.getSenders();
            const videoSender = senders.find((s: any) => s.track?.kind === "video");
            if (videoSender) {
              videoSender.replaceTrack(userStreamRef.current.getVideoTracks()[0]).catch((err: any) => console.error("Error replacing track:", err));
            }
          }
        };

        // Replace video track with screen share track in peer connection
        if (peerRef.current) {
          const peerConnection = (peerRef.current as any)._pc;
          const senders = peerConnection.getSenders();
          const videoSender = senders.find((s: any) => s.track?.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]).catch((err: any) => console.error("Error replacing track:", err));
          }
        }

        // Notify peer about screen sharing
        peerRef.current?.send(JSON.stringify({ type: "screenShare", isScreenSharing: true }));
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = undefined;
        }
        setIsScreenSharing(false);

        // Replace screen share track with original video track
        if (peerRef.current && userStreamRef.current) {
          const peerConnection = (peerRef.current as any)._pc;
          const senders = peerConnection.getSenders();
          const videoSender = senders.find((s: any) => s.track?.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(userStreamRef.current.getVideoTracks()[0]).catch((err: any) => console.error("Error replacing track:", err));
          }
        }

        // Restore to original video state
        if (wasVideoEnabledBeforeScreenShare.current) {
          toggleVideoMute({ forceState: false, noUIToggle: false });
        } else {
          toggleVideoMute({ forceState: true, noUIToggle: false });
        }

        // Notify peer about stopping screen share
        peerRef.current?.send(JSON.stringify({ type: "screenShare", isScreenSharing: false }));
      }
    } catch (err) {
      console.error("Error sharing screen:", err);
      setIsScreenSharing(false);
      peerRef.current?.send(JSON.stringify({ type: "screenShare", isScreenSharing: false }));
    }
  };

  const sendMessage = (message: string) => {
    chatEngineRef.current?.sendMessage(message);
  };

  const sendFile = async (file: File, onProgress?: (progress: number) => void) => {
    await chatEngineRef.current?.sendFile(file, onProgress);
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
    isScreenSharing,
    isPeerScreenSharing,
    toggleScreenShare,
    messages,
    sendMessage,
    sendFile,
    username,
    setUsername,
    peerUsername,
    setPeerUsername,
  };

  return <globalContext.Provider value={values}>{children}</globalContext.Provider>;
}

export function useGlobal() {
  return useContext(globalContext);
}
