// server/index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

const emitRoomsUpdate = () => {
  io.emit("rooms-update", rooms);
};

io.on("connection", (socket) => {
  socket.on("join-room", ({ name, roomId }) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    if (rooms[roomId].length >= 3) {
      socket.emit("room-full");
      return;
    }
    rooms[roomId].push({ id: socket.id, name });
    socket.join(roomId);
    io.to(roomId).emit("player-joined", rooms[roomId]);
    if (rooms[roomId].length === 3) {
      io.to(roomId).emit("start-game");
    }
    emitRoomsUpdate();
  });

  socket.on("get-rooms", () => {
    socket.emit("rooms-update", rooms);
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const before = rooms[roomId].length;
      rooms[roomId] = rooms[roomId].filter((p) => p.id !== socket.id);
      if (rooms[roomId].length !== before) {
        io.to(roomId).emit("player-joined", rooms[roomId]);
      }
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
    emitRoomsUpdate();
  });
});

server.listen(4000, () => console.log("Socket server running on 4000"));
