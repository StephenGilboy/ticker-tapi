var socket = io.connect('http://localhost:3000');


socket.on('quote', function (d) {
	console.log("QUOTE");
	console.log(d);
});

socket.on('error', function (e) {
	console.error(e);
});

socket.emit('subscribe', 'GOOG');
socket.emit('subscribe', 'MSFT');

setTimeout(function () {
	socket.emit('unsubscribe', 'GOOG');
  socket.emit('unsubscribe', 'MSFT');
}, 600000);
