let express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('./'));

io.on('connection', (socket) => {
  socket.on(
      'send_message', (text) => { io.sockets.emit('receive_message', text); });
});

let port = 3000;
http.listen(port, function() {
  console.log(
      'Expressサーバーがポート%dで起動しました。モード:%s', port,
      app.settings.env)
});
