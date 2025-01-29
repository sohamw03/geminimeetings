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
  const [messages, setMessages] = useState<Values["messages"]>([]);

  const userVideoRef = useRef<HTMLVideoElement | undefined | null | any>();
  const peerVideoRef = useRef<HTMLVideoElement | undefined | null | any>();
  const socketRef = useRef<Socket>();
  const userStreamRef = useRef<MediaStream>();
  const peerRef = useRef<SimplePeer.Instance>();
  const hostRef = useRef<boolean>(false);
  const screenStreamRef = useRef<MediaStream>();
  const wasVideoEnabledBeforeScreenShare = useRef<boolean>(false); // Add this line
  const MAX_CHUNK_SIZE = 16 * 1024; // 16KB chunks (reduced from 256KB)
  const MAX_CONCURRENT_CHUNKS = 3; // Reduced from 5 to prevent buffer overflow
  const CHUNK_DELAY = 50; // Increased delay between chunks to 50ms
  const MAX_RETRIES = 3;
  const CHUNK_TIMEOUT = 10000; // 10 seconds timeout per chunk
  const MAX_FILE_SIZE = 5000 * 1024 * 1024; // 5000MB
  const fileChunksRef = useRef<{ [key: string]: { chunks: (string | null)[]; total: number } }>({});
  const transfersRef = useRef<{
    [fileId: string]: {
      chunks: (ArrayBuffer | null)[];
      pieces: { [index: number]: (ArrayBuffer | null)[] }; // Store pieces of chunks
      total: number;
      received: Set<number>;
      timeouts: { [index: number]: NodeJS.Timeout };
    };
  }>({});

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

        // Add data channel handlers
        peerRef.current.on("data", (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === "screenShare") {
            setIsPeerScreenSharing(message.isScreenSharing);
          } else if (message.type === "file-chunk") {
            // Handle file chunk
            const { fileId, chunk, index, total, fileName, pieceIndex, totalPieces } = message;

            // Initialize transfer tracking if needed
            if (!transfersRef.current[fileId]) {
              transfersRef.current[fileId] = {
                chunks: Array(total).fill(null),
                pieces: {}, // Store pieces of chunks
                total,
                received: new Set(),
                timeouts: {},
              };
            }

            const transfer = transfersRef.current[fileId];

            // Initialize pieces array for this chunk if needed
            if (!transfer.pieces[index]) {
              transfer.pieces[index] = Array(totalPieces).fill(null);
            }

            // Store piece
            const chunkBuffer = Uint8Array.from(atob(chunk), (c) => c.charCodeAt(0)).buffer;
            transfer.pieces[index][pieceIndex] = chunkBuffer;

            // Check if all pieces of this chunk are received
            if (!transfer.pieces[index].includes(null)) {
              // Combine pieces into complete chunk
              const validPieces = transfer.pieces[index].filter((piece): piece is ArrayBuffer => piece !== null);
              const completeChunk = concatenateArrayBuffers(validPieces);
              transfer.chunks[index] = completeChunk;
              transfer.received.add(index);
              delete transfer.pieces[index]; // Clean up pieces

              // Send acknowledgment
              peerRef.current?.send(
                JSON.stringify({
                  type: "chunk-ack",
                  fileId,
                  index,
                })
              );

              // Check if transfer is complete
              if (transfer.received.size === total) {
                const validChunks = transfer.chunks.filter((chunk): chunk is ArrayBuffer => chunk !== null);
                const blob = new Blob(validChunks);
                const reader = new FileReader();
                reader.onload = (e) => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      type: "file",
                      content: e.target?.result as string,
                      fileName,
                      sender: "peer",
                    },
                  ]);
                };
                reader.readAsDataURL(blob);
                delete transfersRef.current[fileId];
              }
            }
          } else if (message.type === "chat") {
            setMessages((prev) => [...prev, { ...message, sender: "peer" }]);
          }
        });

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

        // Add data channel handlers
        peerRef.current.on("data", (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === "screenShare") {
            setIsPeerScreenSharing(message.isScreenSharing);
          } else if (message.type === "file-chunk") {
            // Handle file chunk
            const { fileId, chunk, index, total, fileName, pieceIndex, totalPieces } = message;

            // Initialize transfer tracking if needed
            if (!transfersRef.current[fileId]) {
              transfersRef.current[fileId] = {
                chunks: Array(total).fill(null),
                pieces: {}, // Store pieces of chunks
                total,
                received: new Set(),
                timeouts: {},
              };
            }

            const transfer = transfersRef.current[fileId];

            // Initialize pieces array for this chunk if needed
            if (!transfer.pieces[index]) {
              transfer.pieces[index] = Array(totalPieces).fill(null);
            }

            // Store piece
            const chunkBuffer = Uint8Array.from(atob(chunk), (c) => c.charCodeAt(0)).buffer;
            transfer.pieces[index][pieceIndex] = chunkBuffer;

            // Check if all pieces of this chunk are received
            if (!transfer.pieces[index].includes(null)) {
              // Combine pieces into complete chunk
              const validPieces = transfer.pieces[index].filter((piece): piece is ArrayBuffer => piece !== null);
              const completeChunk = concatenateArrayBuffers(validPieces);
              transfer.chunks[index] = completeChunk;
              transfer.received.add(index);
              delete transfer.pieces[index]; // Clean up pieces

              // Send acknowledgment
              peerRef.current?.send(
                JSON.stringify({
                  type: "chunk-ack",
                  fileId,
                  index,
                })
              );

              // Check if transfer is complete
              if (transfer.received.size === total) {
                const validChunks = transfer.chunks.filter((chunk): chunk is ArrayBuffer => chunk !== null);
                const blob = new Blob(validChunks);
                const reader = new FileReader();
                reader.onload = (e) => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      type: "file",
                      content: e.target?.result as string,
                      fileName,
                      sender: "peer",
                    },
                  ]);
                };
                reader.readAsDataURL(blob);
                delete transfersRef.current[fileId];
              }
            }
          } else if (message.type === "chat") {
            setMessages((prev) => [...prev, { ...message, sender: "peer" }]);
          }
        });

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

    window.location.assign("/");
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

  const sendChunk = async (peer: SimplePeer.Instance, fileId: string, chunk: ArrayBuffer, index: number, total: number, fileName: string, retries = 0): Promise<void> => {
    try {
      // Split large chunks into smaller pieces if needed
      const maxSize = 16 * 1024; // 16KB maximum message size
      const uint8Array = new Uint8Array(chunk);
      const numPieces = Math.ceil(uint8Array.length / maxSize);

      for (let i = 0; i < numPieces; i++) {
        const start = i * maxSize;
        const end = Math.min(start + maxSize, uint8Array.length);
        const piece = uint8Array.slice(start, end);

        const chunkData = {
          type: "file-chunk",
          fileId,
          chunk: btoa(String.fromCharCode.apply(null, Array.from(piece))),
          index,
          total,
          fileName,
          pieceIndex: i,
          totalPieces: numPieces,
        };

        peer.send(JSON.stringify(chunkData));

        // Small delay between pieces
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Wait for acknowledgment
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          const handler = (data: any) => {
            const message = JSON.parse(data.toString());
            if (message.type === "chunk-ack" && message.fileId === fileId && message.index === index) {
              peer.off("data", handler);
              resolve();
            }
          };
          peer.on("data", handler);
        }),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error("Chunk timeout")), CHUNK_TIMEOUT)),
      ]);
    } catch (err) {
      if (retries < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (retries + 1)));
        return sendChunk(peer, fileId, chunk, index, total, fileName, retries + 1);
      }
      throw err;
    }
  };

  const sendFile = async (file: File, onProgress?: (progress: number) => void) => {
    if (!peerRef.current) throw new Error("No peer connection");

    const fileId = Math.random().toString(36).substring(7);
    const chunks: ArrayBuffer[] = [];
    const chunkSize = MAX_CHUNK_SIZE;
    const totalChunks = Math.ceil(file.size / chunkSize);

    // Split file into chunks
    for (let i = 0; i < file.size; i += chunkSize) {
      const chunk = await file.slice(i, i + chunkSize).arrayBuffer();
      chunks.push(chunk);
    }

    // Send chunks with parallel processing
    let sentChunks = 0;
    try {
      // Process chunks in batches
      for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CHUNKS) {
        const batch = chunks.slice(i, i + MAX_CONCURRENT_CHUNKS);
        await Promise.all(
          batch.map(async (chunk, index) => {
            const chunkIndex = i + index;
            await sendChunk(peerRef.current!, fileId, chunk, chunkIndex, totalChunks, file.name);
            sentChunks++;
            onProgress?.(Math.round((sentChunks / totalChunks) * 100));
          })
        );
        // Small delay between batches to prevent flooding
        await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY));
      }

      // All chunks sent successfully, add to messages
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setMessages((prev) => [
          ...prev,
          {
            type: "file",
            content: e.target?.result as string,
            fileName: file.name,
            sender: "me",
          },
        ]);
      };
      fileReader.readAsDataURL(file);
    } catch (err: any) {
      throw new Error(`Failed to send file: ${err.message}`);
    }
  };

  const sendMessage = (message: string) => {
    setMessages((prev) => [...prev, { type: "text", content: message, sender: "me" }]);
    peerRef.current?.send(JSON.stringify({ type: "chat", content: message }));
  };

  const concatenateArrayBuffers = (buffers: ArrayBuffer[]): ArrayBuffer => {
    const totalLength = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    buffers.forEach((buffer) => {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    });
    return result.buffer;
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
  };

  return <globalContext.Provider value={values}>{children}</globalContext.Provider>;
}

export function useGlobal() {
  return useContext(globalContext);
}
