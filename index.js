const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
const server = http.createServer(app);
// const io = new Server(server);

// Socket.io

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  console.log("new connection ", socket.id);

  socket.on("join_room", (roomName) => {
    let myroom = roomName.toString();
    const room = io.sockets.adapter.rooms.get(myroom);
    const numClients = room ? room.size : 0;
    console.log(numClients);

    if (numClients < 2) {
      socket.join(myroom);
      const updatedRoom = io.sockets.adapter.rooms.get(myroom);
      const updatedNumClients = updatedRoom ? updatedRoom.size : 0;

      socket.emit("join_room_success", {
        room: myroom,
        numClients: updatedNumClients,
      });
      socket.to(myroom).emit("update_num_clients", {
        room: myroom,
        numClients: updatedNumClients,
      });
      if (updatedNumClients == 2) {
        let tern = Math.floor(Math.random() * 2);
        console.log(tern, "tern");

        socket.to(myroom).emit("game_on", tern);
        socket.emit("game_on", tern);
      }
      console.log(`${socket.id} joined room ${myroom}`);
    } else {
      socket.emit("join_room_failure", {
        room: myroom,
        message: "Room is full",
      });
      console.log(`${socket.id} failed to join room ${myroom} - room is full`);
    }
  });

  socket.on("user-message", (data) => {
    let myroom = data.room.toString();
    io.to(myroom).emit("message", data);
  });
});

app.use(express.static(path.resolve("./public")));

app.get("/", (req, res) => {
  return res.sendFile("/public/index.html");
});

server.listen(9000, () => console.log(`Server Started at PORT:9000`));
