import { Server } from "socket.io";

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    console.log("Socket is already attached");
    return res.end();
  }

  const io = new Server(res.socket.server, {
    path: "/api/socket/",
    cors: { origin: "*" },
  });
  res.socket.server.io = io;

  const roomHosts = new Map();

  io.on("connection", (socket) => {
    console.log(`User connected : ${socket.id}`);

    // Trigger when a peer hits the join room button.
    socket.on("join", (roomName) => {
      const { rooms } = io.sockets.adapter;
      const room = rooms.get(roomName);

      // If room == undefined when the room doesn't exist.
      if (room === undefined) {
        socket.join(roomName);
        roomHosts.set(roomName, socket.id); // Set initial host
        socket.emit("created", { isHost: true });
      } else if (room.size === 1) {
        // If room.size == 1 when the room has one person already.
        socket.join(roomName);
        const isHost = !roomHosts.has(roomName); // If no host exists, become host
        if (isHost) {
          roomHosts.set(roomName, socket.id);
        }
        socket.emit("joined", { isHost });
      } else {
        // When there are already two people in the room.
        socket.emit("full");
      }
      console.log("Rooms:", rooms);
      console.log("Hosts:", roomHosts);
    });

    // Triggered when the person who joined the room is ready to communicate.
    socket.on("ready", (roomName) => {
      console.log("on: ready, roomName: ", roomName);
      socket.broadcast.to(roomName).emit("ready");
      console.log(`broadcast to: ${roomName} ready`);
    });

    // Triggered when server gets an icecandidate from a peer in the room.
    socket.on("ice-candidate", (candidate, roomName) => {
      console.log("on: ice-candidate, roomName: ", roomName);
      socket.broadcast.to(roomName).emit("ice-candidate", candidate); // Sends candidate to the other peer in the room.
      console.log(`broadcast to: ${roomName} ice-candidate`);
    });

    // Triggered when server gets an offer from a peer in the room.
    socket.on("offer", (offer, roomName) => {
      console.log("on: offer, roomName: ", roomName);
      socket.broadcast.to(roomName).emit("offer", offer); // Sends offer to the other peer in the room.
      console.log(`broadcast to: ${roomName} offer`);
    });

    // Triggered when server gets an answer from a peer in the room.
    socket.on("answer", (answer, roomName) => {
      console.log("on: answer, roomName: ", roomName);
      socket.broadcast.to(roomName).emit("answer", answer); // Sends answer to the other peer in the room.
      console.log(`broadcast to: ${roomName} answer`);
    });

    socket.on("leave", (roomName) => {
      console.log("on: leave, roomName: ", roomName);

      // If leaving socket was the host, assign host to remaining peer
      if (roomHosts.get(roomName) === socket.id) {
        const room = io.sockets.adapter.rooms.get(roomName);
        if (room && room.size > 1) {
          // Get the other peer in the room
          const remainingPeer = Array.from(room).find(id => id !== socket.id);
          if (remainingPeer) {
            roomHosts.set(roomName, remainingPeer);
            io.to(remainingPeer).emit("host_changed", { isHost: true });
          }
        }
      }

      socket.leave(roomName);
      socket.broadcast.to(roomName).emit("leave");

      // Check if room is empty after leave and clean it up
      const room = io.sockets.adapter.rooms.get(roomName);
      if (!room || room.size === 0) {
        roomHosts.delete(roomName);
        io.sockets.adapter.rooms.delete(roomName);
        console.log(`Room ${roomName} has been cleaned up`);
      }

      console.log("Rooms:", io.sockets.adapter.rooms);
      console.log("Hosts:", roomHosts);
    });

    socket.on("media_source_change", (data) => {
      console.log("on: media_source_change, data: ", data);
      socket.broadcast.to(data.roomName).emit("media_source_change", data);
      console.log(`broadcast to: ${data.roomName} media_source_change`);
    });

    socket.on("media_source_answer", (data) => {
      console.log("on: media_source_answer, data: ", data);
      socket.broadcast.to(data.roomName).emit("media_source_answer", data.answer);
      console.log(`broadcast to: ${data.roomName} media_source_answer`);
    });
  });

  return res.end();
}
