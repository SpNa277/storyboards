const express = require("express");
const { Server } = require("socket.io");

const fs = require('fs');
const key = fs.readFileSync('./key.pem');
const cert = fs.readFileSync('./diufvm08_unifr_ch.pem');
const https = require('https');

const port = process.env.PORT || 3001;


const app1 = express();
const app2 = express();
const app3 = express();
const app4 = express();
const app5 = express();
const app6 = express();
const app7 = express();
const app8 = express();
const app9 = express();
const app10 = express();

let instances = [
  app1,
  app2,
  app3,
  app4,
  app5,
  app6,
  app7,
  app8,
  app9,
  app10
]

let portCounter = 0;
instances.forEach(app => {
  
let appPort = port + portCounter;

app.use(express.static("./"));



const server = https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('diufvm08_unifr_ch.pem')
}, app);

server.listen(port + portCounter, () => console.log('server listening at port ' + appPort));

portCounter++;

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

});