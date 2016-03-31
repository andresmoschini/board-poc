/// <reference path="../custom-typings/defaults.d.ts" />
/// <reference path="../../typings/express/express.d.ts" />
/// <reference path="../../typings/socket.io/socket.io.d.ts" />
/// <reference path="../../node_modules/rfc6902/rfc6902.d.ts" />

import * as rfc6902 from "rfc6902";
import * as express from "express";
import * as utils from "../common/utils";
import * as model from "../common/model";
import * as httpModule from "http";
import * as socketIO from "socket.io";
import {BoardService} from "./BoardService";

var app = express();
app.use(express.static(__dirname + "/../../client"));
var http = (<any>httpModule).Server(app);
var io = socketIO(http);
var shadow : model.Board = { };
var current : model.Board = utils.clone(shadow);
var boardService = new BoardService();

app.get("/", function(req, res){
  // TODO: add a new index page to allow to select client implementation
  // res.sendFile(__dirname + "/../client/index.html");
  res.redirect("/koclient.html");
});

io.on("connection", function(socket){
  console.log("connection");

  socket.emit( "board", boardService.onClientConnection );

  socket.on("board", boardService.onClientMessage);
});

var interval = 1000;
setInterval(boardService.onTic, interval);

boardService.sendToClient = (changes) => {
  io.emit("board", {patch: changes});
};

http.listen(process.env.PORT || 3000, function(){
  console.log("listening on *:3000");
});
