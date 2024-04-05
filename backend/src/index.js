import express from "express";
import SocketHandler from "./SocketHandler.js";

const app = express();

app.get("/api/socket", SocketHandler);

app.listen(8000, function () {
  console.log("[server]: SocketIO server listening at http://127.0.0.1:8000");
});
