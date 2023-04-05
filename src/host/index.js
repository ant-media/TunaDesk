const { WebSocketServer } = require('ws');

var robot = require("robotjs");

const LOCAL_PORT = 36000;
const HOST= "127.0.0.1"; 
// Speed up the mouse.
robot.setMouseDelay(1);

var twoPI = Math.PI * 2.0;
var screenSize = robot.getScreenSize();
var height = (screenSize.height / 2) - 10;
var width = screenSize.width;



const wss = new WebSocketServer({ host: HOST, port: LOCAL_PORT });

wss.on('connection', function connection(ws) {
  
  console.log("Connection established");

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    var object = JSON.parse(data);

    console.log('received: %s', object.event);
    if (object.event == "mousemove") {
      var mouseX = parseInt(object.x * robot.getScreenSize().width);
      var mouseY = parseInt(object.y * robot.getScreenSize().height);
      console.log("mouse x: " + mouseX + " mouse y: " + mouseY + " screen size:" + robot.getScreenSize().width + "x" + robot.getScreenSize().height);
      robot.moveMouse(mouseX, mouseY);
    }
    else if (object.event == "click") {
/*      0: Main button pressed, usually the left button or the un-initialized state
		1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
		2: Secondary button pressed, usually the right button
		3: Fourth button, typically the Browser Back button
		4: Fifth button, typically the Browser Forward button
*/
      var button = "left";
      if (object.button == 1) {
         button = "middle";
      }
      else if (object.button == 2) {
         button = "right";
      }
      robot.mouseClick(button); 
    }
    else if (object.event == "keypress") {
      var modifier = Array();
      if (object.shiftKey) {
         modifier.push("shift");
      } 
      if (object.ctrlKey) {
         modifier.push("control");
      }
      if (object.altKey) {
         modifier.push("alt");
      }
      
      robot.keyTap(object.key.toLowerCase(), modifier); 
    }

    //console.log(data);
  });

  ws.send('something');
});

