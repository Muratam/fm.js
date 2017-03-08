let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

app.use(express.static('./client/root/'));

io.on('connection', (socket) => {
  console.log(socket);
  socket.on('fix_time', (text) => {
    try {
      const log = JSON.parse(text);
      const res =
          JSON.stringify({id: log.id, pre: log.pre, now: new Date().getTime()});
      io.sockets.emit('fix_time', res);
    } catch (e) {
    }
  });
  socket.on('send_message', (text) => {
    // console.log(text);
    io.sockets.emit('receive_message', text);
  });
});

let port = 3000;
http.listen(port, function() {
  console.log(
      'Expressサーバーがポート%dで起動しました。モード:%s', port,
      app.settings.env)
});
