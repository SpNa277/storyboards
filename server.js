const express = require("express");
const { Server } = require("socket.io");

const port = process.env.PORT || 3000;

const app = express();

app.use(express.static("./"));

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const io = new Server(server);

let historyStoryboard = [];
let historyFigures = [];
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

  client.on("deleteHistoryStoryboards", () => {
    historyStoryboard = [];
    io.sockets.emit("deleteAllStoryboards");
  });

  client.on("requestHistoryStoryboards", () => {
    client.emit("historyStoryboards", historyStoryboard);
  });

  client.on("spawnFigure", (senderId, pos, fig) => {
    io.sockets.emit("spawnFigure", senderId, pos, fig);
    historyFigures.push({ pos, fig });
  });

  client.on("deleteFigure", (senderId, index) => {
    io.sockets.emit("deleteFigure", senderId, index);
    historyFigures = historyFigures.filter(
      (_, historyIndex) => index !== historyIndex
    );
  });

  client.on("requestHistoryFigures", () => {
    client.emit("historyFigures", historyFigures);
  });

  client.on("updatePosition", (senderId, index, pos) => {
    io.sockets.emit("updatePosition", senderId, index, pos);
    const obj = historyFigures[index];
    obj.fig.posOffset = pos;
  });

  client.emit("id", client.id);
});
