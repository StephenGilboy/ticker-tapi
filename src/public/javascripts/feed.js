var socket = io.connect('http://localhost:3000');


socket.on('tick', function (d) {
	console.log("QUOTE");
	console.log(d);
});

socket.on('error', function (e) {
	console.log("ERROR");
	console.error(e);
});

socket.emit('subscribe', 'GOOG');
socket.emit('subscribe', 'MSFT');

setTimeout(function () {
	socket.emit('unsubscribe', 'GOOG');
  socket.emit('unsubscribe', 'MSFT');
}, 6000);
