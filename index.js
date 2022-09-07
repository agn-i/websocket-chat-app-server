const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const router = require("./router");
const cors = require("cors");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const app = express();
app.use(cors());
app.use(router);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://zesty-narwhal-5d933c.netlify.app",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }) => {
    const { user } = addUser({ id: socket.id, name, room });
    if (user.name && user.name) {
      socket.join(user.room);
      socket.emit("message", {
        user: "admin",
        text: `${user.name}, welcome to room ${user.room}`,
      });
      socket.broadcast.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has joined!`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", { user: user.name, text: message });
      callback();
    }
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      socket.to(user.room).emit("message", {
        user: "Admin",
        text: `${user.name} has left.`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
