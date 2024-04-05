"use client";

import useSocket from "@/hooks/useSocket";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";

export default function Room({ roomName }: { roomName: string }) {
  useSocket();

  const router = useRouter();
  const userVideoRef = useRef(null);
  const peerVideoRef = useRef(null);
  const rtcConnectionRef = useRef(null);
  const socketRef = useRef<Socket | undefined>();
  const userStreamRef = useRef();
  const hostRef = useRef(false);

  const id = roomName;
  useEffect(() => {
    socketRef.current = io();

    // First when we join the room
    socketRef.current.emit("join", roomName);

    socketRef.current.on("created"), handleRoomCreated);

    socketRef.current.on('joined', handleRoomJoined);
    // If the room didn't exist, the server would emit the room was 'created'

    // Whenever the next person joins, the server emits 'ready'
    socketRef.current.on('ready', initiateCall);

    // Emitted when a peer leaves the room
    socketRef.current.on('leave', onPeerLeave);

    // If the room is full, we show an alert
    socketRef.current.on('full', () => {
      window.location.href = '/';
    });

    // Events that are webRTC speccific
    socketRef.current.on('offer', handleReceivedOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('ice-candidate', handlerNewIceCandidateMsg);

    return () =>socketRef.current?.disconnect();
  }, [roomName]);

  return (
    <div>
      <video autoPlay ref={userVideoRef} />
      <video autoPlay ref={peerVideoRef} />
    </div>
  );
}
