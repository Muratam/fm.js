let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

app.use(express.static('./client/root/'));

io.on('connection', (socket) => {
  console.log(socket);
  socket.on('send_message', (text) => {
    let json = JSON.parse(text);
    console.log([json.status, json.id]);
    io.sockets.emit('receive_message', text);
  });
});

let port = 3000;
http.listen(port, function() {
  console.log(
      'Expressサーバーがポート%dで起動しました。モード:%s', port,
      app.settings.env)
});
