import { NextRequest, NextResponse } from "next/server";
import { Server } from "socket.io";

export default function SocketHandler(NextRequest: Request, NextResponse: NextResponse) {
  if (NextResponse.socket.server.io) {
    console.log("Socket is already attached to server");
    return NextResponse.end();
  }

  const io = new Server(NextResponse.socket.server);
  NextResponse.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log(`User Connected : ${socket.id}`);
  });

  return NextResponse.end();
}
