import "./trigReplacement";
import PivotGame from "./pivot"

window.addEventListener("load", () => {
  document.getElementById("play").addEventListener("click", newConnection);
  
  //load map
  let map = {};
  
  let gameTest: PivotGame;
  
  const mapRequest = new XMLHttpRequest();
  mapRequest.open("GET","map1.json");
  mapRequest.addEventListener("load", function(data) {
    // console.log(mapRequest.response);
    map = JSON.parse(mapRequest.response);
  });
  mapRequest.send();
  
  //canvas maintainence
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  window.addEventListener('resize', resize);
  function resize() {
    canvas.height = innerHeight;
    canvas.width = innerWidth;
  } resize();
  
  function render() {
    try {
      gameTest.render(canvas.getContext('2d'));
      requestAnimationFrame(render);
    } catch(e) {}
  }
  
  function broadcast(msg: string, shadow?: boolean) { 
    (<HTMLElement> document.getElementById('broadcast').firstChild).innerText = msg;
    (<HTMLElement> document.getElementById('broadcast').firstChild).textContent = msg;
    if(shadow)
      document.getElementById('broadcast').style.textShadow = "0 1px 3px black";
    else
      document.getElementById('broadcast').style.textShadow = "none";
  }
  
  let ws: WebSocket;
  
  function newConnection() {
    document.getElementById("play").style.display="none";
    document.getElementById("hometext").style.display="none";
  
    gameTest = undefined;
    ws = new WebSocket("ws://" + location.host);
    broadcast("Connecting to server...");
    ws.addEventListener('message', function(e) {
      const msg = JSON.parse(e.data);
      if (msg.type == "tick") {
        if (gameTest === undefined) {
          gameTest = new PivotGame(msg.inputs.length, map);
          render();
        }
  
        if(!gameTest.update(msg.inputs)) {
          broadcast("Game Over", true);
          setTimeout(function() {ws.close();}, 5000);
        }
      } else if (msg.type == "broadcast") {
        broadcast(msg.message);
      }
    });
    ws.addEventListener('open', function() {
      broadcast("Connected, waiting for another player to join...");
    });
    ws.addEventListener('error', function() {
      broadcast("Something went wrong...");
    });
    ws.addEventListener('close', function() {
      //broadcast("Connection lost. Connecting to a new game...");
      gameTest = undefined;
      broadcast("");
      document.getElementById("play").style.display="block";
      document.getElementById("hometext").style.display="block";
      canvas.getContext("2d").clearRect(0,0,innerWidth,innerHeight);
      //newConnection();
    });
  }
  
  
  //TODO: don't hard-code it to be local!
  let left = false;
  let right = false;
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
  window.addEventListener('touchstart', handleTouch);
  window.addEventListener('touchmove', handleTouch);
  window.addEventListener('touchend', handleTouch);
  function handleTouch(e: TouchEvent) {
    if (ws.readyState == 1) {
      e.preventDefault();
      if (e.touches.length == 1) {
        if (e.touches[0].clientX < window.innerWidth/2) {
          left = true;
          right = false;
          updateControls();
        } else {
          left = false;
          right = true;
          updateControls();
        }
      } else {
        left = false;
        right = false;
        updateControls();
      }
      return false;
    }
  }
  function updateControls() {
    let input = 0;
    if (left) input++;
    if (right)input--;
    ws.send(JSON.stringify({
      "type": "input",
      "input": input
    }));
  }
})