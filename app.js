//connection with server
const express = require("express");

//invoke express
const app = express();

//define port number
const PORT = 5000;
const http = require("http");
const server = http.createServer(app);

//connection with database
const mongoose = require("mongoose");

//connection with socket.io for drafts
const socketio = require("socket.io");

const io = socketio(server);

io.on("connection", (socket) => {
  console.log("We have a new connection!!");

  socket.on("join", ({ name, room }, callback) => {
    console.log(name, room);
    error: true;
  });

  socket.on("disconnect", () => {
    console.log("User has left!!");
  });
});

const { MONGOURI } = require("./keys");

mongoose.connect(MONGOURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connection successfull with MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.log("Connection unsuccessfull", err);
});

require("./models/user");
require("./models/post");

//register routes
app.use(express.json());
app.use(require("./routes/auth"));
app.use(require("./routes/post"));
app.use(require("./routes/user"));

server.listen(PORT, () => {
  console.log("server is running on ", PORT);
});
