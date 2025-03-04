import express from "express";
import SocketHandler from "./SocketHandler.js";
import cors from "cors";
import os from "os";

const PORT = 8000

const app = express();

app.use(cors()); // Enable CORS for all origins

app.get("/api/socket", SocketHandler);

app.get("/", (req, res) => {
  res.send("GeminiMeetings WebRTC Server is running");
});

app.get("/api/keep-alive", (req, res) => {
  res.send(true);
});


// Function to get the local network IP address
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e., 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback if no network IP found
}

app.listen(8000, function () {
  console.log(`GeminiMeetings backend is running!`);
  console.log(`Local: http://127.0.0.1:${PORT}`);
  console.log(`Network: http://${getNetworkIP()}:${PORT}`);
});
