import { Server } from "socket.io";

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    console.log("Socket is already attached");
    return res.end();
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log(`User connected : ${socket.id}`);

    // Trigger when a peer hits the join room button.
    socket.on("join", (roomName) => {
      const { rooms } = io.sockets.adapter;
      const room = rooms.get(roomName);

      // If room == undefined when the room doesn't exist.
      if (room === undefined) {
        socket.join(roomName);
        socket.emit("created");
      } else if (room.size === 1) {
        // If room.size == 1 when the room has one person already.
        socket.join(roomName);
        socket.emit("joined");
      } else {
        // When there are already two people in the room.
        socket.emit("full");
      }
      console.log(rooms);
    });

    // Triggered when the person who joined the room is ready to communicate.
    socket.on("ready", (roomName) => {
      socket.broadcast.to(roomName).emit("ready");
    });

    // Triggered when server gets an icecandidate from a peer in the room.
    socket.on("ice-candidate", (candidate, roomName) => {
      console.log(candidate);
      socket.broadcast.to(roomName).emit("ice-candidate", candidate); // Sends candidate to the other peer in the room.
    });

    // Triggered when server gets an offer from a peer in the room.
    socket.on("offer", (offer, roomName) => {
      socket.broadcast.to(roomName).emit("offer", offer); // Sends offer to the other peer in the room.
    });

    // Triggered when server gets an answer from a peer in the room.
    socket.on("answer", (answer, roomName) => {
      socket.broadcast.to(roomName).emit("answer", answer); // Sends answer to the other peer in the room.
    });

    socket.on("leave", (roomName) => {
      socket.leave(roomName);
      socket.broadcast.to(roomName).emit("leave");
    });
  });

  return res.end();
}
