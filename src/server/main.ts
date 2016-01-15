/// <reference path="../custom-typings/defaults.d.ts" />
/// <reference path="../../typings/express/express.d.ts" />
/// <reference path="../../typings/socket.io/socket.io.d.ts" />
/// <reference path="../../node_modules/rfc6902/rfc6902.d.ts" />

import * as rfc6902 from "rfc6902";
import * as express from "express";
var app = express();
app.use(express.static(__dirname + "/../../client"));

import * as httpModule from "http";
var http = (<any>httpModule).Server(app);

import * as socketIO from "socket.io";
var io = socketIO(http);

import * as Utils from "../common/utils";
import * as Model from "../common/model";

var shadow : Model.Board = { };

var current : Model.Board = Utils.clone(shadow);

app.get("/", function(req, res){
  // TODO: add a new index page to allow to select client implementation
  // res.sendFile(__dirname + "/../client/index.html");
  res.redirect("/koclient.html");
});

io.on("connection", function(socket){
  console.log("connection");

  // TODO: send current board at first connection in place of clean all
  current = { };

  socket.on("board", function(msg: Model.Message) {
    var board = (<Model.BoardMessage>msg).board;
    var patch = (<Model.PatchMessage>msg).patch;
    if (board) {
      // TODO: do something
    } else if (patch) {
      var output = rfc6902.applyPatch(current, patch);
    }
  });
});

var interval = 1000;
setInterval(function() {
  // I am clonnig patch because the created objects has the same reference 
  var changes = Utils.clone(rfc6902.createPatch(shadow, current));
  if (changes.length) {
    rfc6902.applyPatch(shadow, changes);
    io.emit("board", { patch: changes });
  }
}, interval);


http.listen(process.env.PORT || 3000, function(){
  console.log("listening on *:3000");
});
