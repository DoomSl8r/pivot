/*
 * Scott Little
 * Andrew Koroluk
 * 12 OCT 2013
 */




//load map
var map = {};

var mapRequest = new XMLHttpRequest();
mapRequest.open("GET","map.json");
mapRequest.addEventListener("success", function(data) {
	map = JSON.parse(data);
});
mapRequest.send();

//canvas maintainence
var canvas = document.getElementById('canvas');
window.addEventListener('resize', resize);
function resize() {
	canvas.width = innerWidth;
	canvas.height = innerHeight;
} resize();

function render() {
	gameTest.render(canvas.getContext('2d'));
	requestAnimationFrame(render);
}

function broadcast(msg) {
	document.getElementById('broadcast').firstChild.innerText = msg;
}

function newConnection() {
	delete gameTest;
	gameTest = undefined;
	ws = new WebSocket("ws://scottlittle.me:8080");
	broadcast("Connecting to server...");
	ws.addEventListener('message', function(e) {
		var msg = JSON.parse(e.data);
		if (msg.type == "tick") {
			if (gameTest == undefined) {
				gameTest = new PivotGame(msg.inputs.length, map);
				render();
			}

			gameTest.update(msg.inputs);
		} else if (msg.type == "broadcast") {
			broadcast(msg.message);
		}
	});
	ws.addEventListener('open', function() {
		broadcast("Connected!");
	})
	ws.addEventListener('error', function() {
		broadcast("Something went wrong...");
	});
	ws.addEventListener('close', function() {
		broadcast("Connection lost. Connecting to a new game...");
		newConnection();
	});
} newConnection();


//TODO: don't hard-code it to be local!
var left = false;
var right = false;
window.addEventListener('keydown', function(e) {
	if (e.keyCode == 37) {
		left = true;
		updateControls();
	} else if (e.keyCode == 39) {
		right = true;
		updateControls();
	}
});
window.addEventListener('keyup', function(e) {
	if (e.keyCode == 37) {
		left = false;
		updateControls();
	} else if (e.keyCode == 39) {
		right = false;
		updateControls();
	}
});
function updateControls() {
	var input = 0;
	if (left) input++;
	if (right)input--;
	ws.send(JSON.stringify({
		"type": "input",
		"input": input
	}));
}