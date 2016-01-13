var rfc6902 = require("rfc6902");
var express = require("express"); 
var app = express();
app.use(express.static(__dirname + "/../client"));

var http = require("http").Server(app);
var io = require("socket.io")(http);

var shadow = { };

var current = JSON.parse(JSON.stringify(shadow));

app.get('/', function(req, res){
  // TODO: add a new index page to allow to select client implementation
  // res.sendFile(__dirname + '/../client/index.html');
  res.redirect('/koclient.html')
});

io.on("connection", function(socket){
  console.log("connection");

  // TODO: send current board at first connection in place of clean all
  current = { };

  socket.on("board", function(msg){
    if (msg.patch) {
      var output = rfc6902.applyPatch(current, msg.patch);
    }
  });
});

var interval = 1000;
setInterval(function() {
  // I am clonnig patch because the created objects has the same reference 
  var changes = JSON.parse(JSON.stringify(rfc6902.createPatch(shadow, current)));
  if (changes.length) {
    rfc6902.applyPatch(shadow, changes);
    io.emit("board", { patch: changes });
  }
}, interval);


http.listen(process.env.PORT || 3000, function(){
  console.log("listening on *:3000");
});
