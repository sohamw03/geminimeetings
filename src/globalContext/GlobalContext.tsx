"use client";
import useSocket from "@/hooks/useSocket";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

export interface Values {
  userVideoRef: React.RefObject<HTMLVideoElement | undefined | null>;
  peerVideoRef: React.RefObject<HTMLVideoElement | undefined | null>;
  setRoomName: React.Dispatch<React.SetStateAction<string>>;
  leaveRoom: () => void;
  toggleAudioMute: () => void;
  toggleVideoMute: () => void;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  audioDevices: { selectedDevice: MediaDeviceInfo | null; devices: MediaDeviceInfo[] };
  setAudioDevices: React.Dispatch<React.SetStateAction<{ selectedDevice: MediaDeviceInfo | null; devices: MediaDeviceInfo[] }>>;
  videoDevices: { selectedDevice: MediaDeviceInfo | null; devices: MediaDeviceInfo[] };
  setVideoDevices: React.Dispatch<React.SetStateAction<{ selectedDevice: MediaDeviceInfo | null; devices: MediaDeviceInfo[] }>>;
  initOrRefreshMediaStream: (mode: "init" | "refresh", audioDeviceId?: string | null, videoDeviceId?: string | null) => void;
}

const globalContext = createContext<Values>({} as Values);

export function GlobalContextProvider({ children }: { children: React.ReactNode }) {
  // Global states
  const [roomName, setRoomName] = useState<string>("");
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [audioDevices, setAudioDevices] = useState<{ selectedDevice: MediaDeviceInfo | null; devices: MediaDeviceInfo[] }>({
    selectedDevice: null,
    devices: [],
  });
  const [videoDevices, setVideoDevices] = useState<{ selectedDevice: MediaDeviceInfo | null; devices: MediaDeviceInfo[] }>({
    selectedDevice: null,
    devices: [],
  });

  const toggleAudioMute = () => {
    if (userStreamRef.current) {
      userStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideoMute = () => {
    if (userStreamRef.current) {
      userStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoMuted(!isVideoMuted);
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
        // Use the stream
        const audioTracks = stream.getAudioTracks();

        // Create a new MediaStream without audio
        const newStream = new MediaStream(stream.getVideoTracks());

        userStreamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = newStream as MediaStream;
          userVideoRef.current.onloadedmetadata = () => {
            userVideoRef.current?.play();
          };
        }
      })
      .catch((err) => console.error(err));

    if (mode === "refresh") {
      socketRef.current?.emit("leave", roomName);
      // Safely closes the existing connection established with the peer who left.
      if (rtcConnectionRef.current) {
        rtcConnectionRef.current.ontrack = null;
        rtcConnectionRef.current.onicecandidate = null;
        rtcConnectionRef.current.close();
        rtcConnectionRef.current = null;
      }
      socketRef.current?.emit("join", roomName);
    }
  };

  // Get the list of audio and video devices on load
  const listDevices = async () => {
    console.log("Enumerating devices");
    if (!navigator.mediaDevices?.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
    } else {
      let localAudioDevices: { selectedDevice: MediaDeviceInfo | null; devices: MediaDeviceInfo[] } = { selectedDevice: null, devices: [] };
      let localVideoDevices: { selectedDevice: MediaDeviceInfo | null; devices: MediaDeviceInfo[] } = { selectedDevice: null, devices: [] };

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
          localAudioDevices.selectedDevice = localAudioDevices.devices[0];
          localVideoDevices.selectedDevice = localVideoDevices.devices[0];
          setAudioDevices(localAudioDevices);
          setVideoDevices(localVideoDevices);
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
    navigator.mediaDevices.addEventListener("devicechange", (event) => {
      listDevices();
    });
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", (event) => {
        listDevices();
      });
    };
  }, []);

  /** Code to handle WebRTC logic **/
  useSocket();

  const userVideoRef = useRef<HTMLVideoElement | undefined | null | any>();
  const peerVideoRef = useRef<HTMLVideoElement | undefined | null | any>();
  const rtcConnectionRef = useRef<RTCPeerConnection | null>();
  const socketRef = useRef<Socket>();
  const userStreamRef = useRef<MediaStream>();
  const hostRef = useRef<boolean>(false);

  // UseEffect to handle the socket connection and events
  useEffect(() => {
    console.log("func: Initiating socket connection");

    if (socketRef.current != undefined || roomName == "") {
      console.log("cond: Socket already exists or roomName is empty. Exiting...");
      return;
    }

    socketRef.current = io(`${process.env.NEXT_PUBLIC_WS_HOST}`, {
      path: "/api/socket/",
    });

    // First when we join the room
    socketRef.current.emit("join", roomName);
    console.log("emit: join", roomName);

    socketRef.current.on("created", handleRoomCreated);

    socketRef.current.on("joined", handleRoomJoined);
    // If the room didn't exist, the server would emit the room was 'created'

    // Whenever the next person joins, the server emits 'ready'
    socketRef.current.on("ready", initiateCall);

    // Emitted when a peer leaves the room
    socketRef.current.on("leave", onPeerLeave);

    // If the room is full, we show an alert
    socketRef.current.on("full", () => {
      window.location.href = "/";
    });

    // Events that are webRTC specific
    socketRef.current.on("offer", handleReceivedOffer);
    socketRef.current.on("answer", handleAnswer);
    socketRef.current.on("ice-candidate", handlerNewIceCandidateMsg);
  }, [roomName]);

  const handleRoomCreated = () => {
    console.log("on: created - handleRoomCreated");
    hostRef.current = true;
    initOrRefreshMediaStream("init");
  };

  const handleRoomJoined = () => {
    console.log("on: joined - handleRoomJoined");
    initOrRefreshMediaStream("init");
    socketRef.current?.emit("ready", roomName);
    console.log("emit: ready", roomName);
  };

  const initiateCall = () => {
    console.log("on: ready - initiateCall");
    if (hostRef.current) {
      rtcConnectionRef.current = createPeerConnection();
      rtcConnectionRef.current
        ?.createOffer()
        .then((offer) => {
          rtcConnectionRef.current?.setLocalDescription(offer);
          socketRef.current?.emit("offer", offer, roomName);
        })
        .catch((err) => console.error(err));
    }
  };

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }, //
      // { urls: "stun:stun.l.google.com:5349" },
      // { urls: "stun:stun1.l.google.com:3478" },
      { urls: "stun:stun1.l.google.com:5349" },
      { urls: "stun:stun2.l.google.com:19302" },
      // { urls: "stun:stun2.l.google.com:5349" },
      { urls: "stun:stun3.l.google.com:3478" },
      // { urls: "stun:stun3.l.google.com:5349" },
      { urls: "stun:stun4.l.google.com:19302" },
      // { urls: "stun:stun4.l.google.com:5349" },
    ],
  };

  const createPeerConnection = () => {
    // We create a new RTCPeerConnection
    const connection = new RTCPeerConnection(ICE_SERVERS);

    // We implement our onicecandidate method for when we received a ICE candidate from stun server
    connection.onicecandidate = handleICECandidateEvent;

    // We implement our onTrack method for when we receive tracks
    connection.ontrack = handleTrackEvent;

    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach((track) => {
        connection.addTrack(track, userStreamRef.current as MediaStream);
      });
    }
    return connection;
  };

  const handleReceivedOffer = (offer: RTCSessionDescriptionInit) => {
    console.log("on: offer - handleReceivedOffer");
    if (!hostRef.current) {
      rtcConnectionRef.current = createPeerConnection();
      rtcConnectionRef.current.setRemoteDescription(offer);

      rtcConnectionRef.current
        .createAnswer()
        .then((answer) => {
          rtcConnectionRef.current?.setLocalDescription(answer);
          socketRef.current?.emit("answer", answer, roomName);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const handleAnswer = (answer: RTCSessionDescriptionInit) => {
    console.log("on: answer - handleAnswer");
    if (rtcConnectionRef.current)
      rtcConnectionRef.current //
        .setRemoteDescription(answer)
        .catch((err) => console.log(err));
  };

  const handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      socketRef.current?.emit("ice-candidate", event.candidate, roomName);
    }
  };

  const handlerNewIceCandidateMsg = (incoming: RTCIceCandidateInit) => {
    console.log("on: ice-candidate - handlerNewIceCandidateMsg");
    // We cast the incoming candidate to RTCIceCandidate
    const candidate = new RTCIceCandidate(incoming);
    rtcConnectionRef.current?.addIceCandidate(candidate).catch((e) => console.log(e));
  };

  const handleTrackEvent = (event: RTCTrackEvent) => {
    console.log("func: track - handleTrackEvent; tracks: ", event.streams[0].getTracks());

    if (peerVideoRef.current && event.streams && event.streams[0]) {
      const stream = event.streams[0];

      // Ensure all tracks are unmuted
      stream.getTracks().forEach((track) => {
        track.enabled = true;
      });

      // Set the new stream
      peerVideoRef.current.srcObject = stream;

      // Listen for track ended events
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          console.log(`Track ${track.kind} ended`);
          // Handle track end - maybe request a new offer from the sender
        };
      });

      // Play the video
      peerVideoRef.current.onloadedmetadata = () => {
        peerVideoRef.current?.play();
      };

      // Update the outbound stream
      if (userStreamRef) {
        rtcConnectionRef.current?.getSenders().forEach((sender) => {
          if (sender.track && userStreamRef.current) {
            sender.replaceTrack(userStreamRef.current.getTracks().find((track) => track.kind === sender.track?.kind) as MediaStreamTrack);
          }
        });
      }
    } else {
      console.error("Missing video element or stream");
    }
  };

  const leaveRoom = () => {
    socketRef.current?.emit("leave", roomName);

    if (userVideoRef.current?.srcObject) {
      (userVideoRef.current.srcObject as MediaStream).getTracks().forEach((track: MediaStreamTrack) => track.stop()); // Stops receiving all track of User.
    }
    if (peerVideoRef.current?.srcObject) {
      (peerVideoRef.current.srcObject as MediaStream).getTracks().forEach((track: MediaStreamTrack) => track.stop()); // Stops receiving audio track of Peer.
    }

    // Checks if there is peer on the other side and safely closes the existing connection established with the peer.
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.ontrack = null;
      rtcConnectionRef.current.onicecandidate = null;
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    }
    socketRef.current?.disconnect();
    window.location.assign("/");
  };

  const onPeerLeave = () => {
    console.log("on: leave - onPeerLeave");
    // This person is now the creator because they are the only person in the room.
    hostRef.current = true;
    if (peerVideoRef.current?.srcObject) {
      (peerVideoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop()); // Stops receiving all track of Peer.
    }

    // Safely closes the existing connection established with the peer who left.
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.ontrack = null;
      rtcConnectionRef.current.onicecandidate = null;
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    }
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
  };

  return <globalContext.Provider value={values}>{children}</globalContext.Provider>;
}

export function useGlobal() {
  return useContext(globalContext);
}
