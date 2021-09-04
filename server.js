const express = require("express");
const { Server } = require("socket.io");

const port = process.env.PORT || 3000;

const app = express();

app.use(express.static("./"));

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const io = new Server(server);

const historyStoryboard = [];
io.on("connection", (client) => {
  console.log(
    "User " +
      client.id +
      " connected, there are " +
      io.engine.clientsCount +
      " clients connected"
  );
  client.on("disconnect", () => {
    console.log("user disconnected");
  });

  client.on("addStoryboard", (senderId, bg) => {
    io.sockets.emit("addStoryboard", senderId, bg);
    historyStoryboard.push(bg);
  });

  client.on("requestHistory", () => {
    client.emit("history", historyStoryboard);
  });

  client.emit("id", client.id);
});
