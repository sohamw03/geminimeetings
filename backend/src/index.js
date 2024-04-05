import express from "express";
import SocketHandler from "./SocketHandler.js";
import cors from "cors";

const app = express();

app.use(cors()); // Enable CORS for all origins

app.get("/api/socket", SocketHandler);

app.listen(8000, function () {
  console.log("[server]: SocketIO server listening at http://127.0.0.1:8000");
});
