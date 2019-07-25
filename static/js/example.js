  var host = window.document.location.host.replace(/:.*/, '');

  var client = new Colyseus.Client(location.protocol.replace("http", "ws") + host + (location.port ? ':' + location.port : ''));
  var room = client.join("example");

  var players = {};
  var colors = ['red', 'green', 'yellow', 'blue', 'cyan', 'magenta'];

  var items = [];
  var PI2 = 2* Math.PI;
  
  var KEY_LEFT = 37;
  var KEY_UP = 38;
  var KEY_RIGHT = 39;
  var KEY_DOWN = 40;

  var sprites = {
    sprite1 : {
      file: "sprite1.png",
      width: 115,
      height: 115
    },
    sprite2 : {
      file: "sprite2.png",
      width: 115,
      height: 115
    },
    sprite3 : {
      file: "sprite3.png",
      width: 115,
      height: 115
    },
    sprite4 : {
      file: "sprite4.png",
      width: 115,
      height: 115
    },
    flag1 : {
      file: "flag1.png",
      width: 63,
      height: 61
    },
    block1 : {
      file: "block1.png",
      width: 40,
      height: 36
    },
    portal1 : {
      file: "portal1.png",
      width: 105,
      height: 100
    }
  }

  for (var id in sprites){
    var img =  new Image();
    img.onload = function(){
      sprites[id].loaded = true;
    }
    img.src="/sprites/"+sprites[id].file;
    sprites[id].image = img;
  }

  

var canvas = document.getElementById("game");
var button_up = document.getElementById("move-up");
var button_down = document.getElementById("move-down");
var button_left = document.getElementById("move-left");
var button_right = document.getElementById("move-right");


  function drawObject(ctx,object){
    ctx.beginPath();
    if (!object.visible){
      return;
    }
    //console.log("Draw",object);
    var w=object.width?object.width:object.radius*2;
    var h=object.height?object.height:object.radius*2;
    if (object.radius && object.bgcolor){
      ctx.fillStyle = object.bgcolor;
      ctx.arc(object.x, object.y, object.radius,0, PI2);
      ctx.fill(); 
    }
    if (object.width*object.height && object.bgcolor){
      ctx.fillStyle = object.bgcolor;
      ctx.fillRect(object.x-object.width/2,object.y-object.height/2,object.width,object.height); 
    }
    if (object.sprite && sprites[object.sprite]){
      var sp=sprites[object.sprite];
      ctx.drawImage(sp.image,sp.width*object.spriteX,sp.height*object.spriteY,sp.width,sp.height,object.x-w/2,object.y-w/2,w,h);
    }
    if (object.type=="player"){
      if (object.flagTimeout){
        ctx.fillStyle = "#000";
        ctx.font = "30 px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🚩", object.x+w/2, object.y-h/2); 
      }
    }
    if (object.label){
      ctx.fillStyle = "#000";
      ctx.font = object.fontSize + "px Arial";
      ctx.textAlign = "center";
      ctx.fillText(object.label, object.x, object.y-w/2);  
    }
  }

  function drawObjects(){
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,1000,1000);
    for(var $i=0; $i<items.length; $i++){
      var object = items[$i];
      drawObject(ctx,object);
    }
    for(var $index in this.players){
      var object = this.players[$index];
      drawObject(ctx,object);
    }
  }

  room.onJoin.add(function() {
    // listen to patches coming from the server
    room.state.players.onAdd = function(player, sessionId) {
      players[sessionId] = player;
      console.log("Player",player);
      drawObjects();
    }

    room.state.items.onAdd = function(item, sessionId) {
      
      items.push(item);
      drawObjects();
    }

    room.state.players.onRemove = function(player, sessionId) {
      delete players[sessionId];
    }

    room.state.players.onChange = function (player, sessionId) {
      drawObjects();
    }
  })

  window.addEventListener("keydown", function (e) {
    keyDown(e.which);
  })

  window.addEventListener("keyup", function (e) {
    cancelKey();
  })

  button_up.addEventListener("mousedown", function (e) {
    keyDown(KEY_UP);
  })
  button_down.addEventListener("mousedown", function (e) {
    keyDown(KEY_DOWN);
  })
  button_left.addEventListener("mousedown", function (e) {
    keyDown(KEY_LEFT);
  })
  button_right.addEventListener("mousedown", function (e) {
    keyDown(KEY_RIGHT);
  })

  canvas.addEventListener("mousedown", function (e) {
    var px=e.offsetX*1000/canvas.clientWidth;
    var py=e.offsetY*1000/canvas.clientHeight;
    var d1= (px/py)>1;
    var d2= (px/(1000-py))>1;
    console.log("Mouse", px, py, d1,d2, e);
    if (d1 && d2){
      keyDown(KEY_RIGHT);
    }
    if (!d1 && !d2){
      keyDown(KEY_LEFT);
    }
    if (d1 && !d2){
      keyDown(KEY_UP);
    }
    if (!d1 && d2){
      keyDown(KEY_DOWN);
    }
  })

  canvas.addEventListener("mouseup", function (e) {
    cancelKey();
  })

  canvas.addEventListener("touchstart", function (e) {
    var originX=e.targetTouches[0].clientX-canvas.offsetLeft;
    var originY=e.targetTouches[0].clientY-canvas.offsetTop;
    var px=originX*1000/canvas.clientWidth;
    var py=originY*1000/canvas.clientHeight;
    var d1= (px/py)>1;
    var d2= (px/(1000-py))>1;
    console.log("Touch", px, py, d1,d2, e);
    if (d1 && d2){
      keyDown(KEY_RIGHT);
    }
    if (!d1 && !d2){
      keyDown(KEY_LEFT);
    }
    if (d1 && !d2){
      keyDown(KEY_UP);
    }
    if (!d1 && d2){
      keyDown(KEY_DOWN);
    }
  })

  canvas.addEventListener("touchend", function (e) {
    cancelKey();
  })
  
  function keyDown(key){
    cancelKey();
    if (key === 38) {
      up();
    } else if (key=== 39) {
      right();

    } else if (key === 40) {
      down();

    } else if (key === 37) {
      left();
    }  
    window.lastKeyEvent=window.setTimeout(keyDown,66,key);
  }

  function cancelKey(){
    if (window.lastKeyEvent){
      window.clearTimeout(window.lastKeyEvent);
    }
  }


  function up () {
    room.send({ y: -1 });
  }

  function right () {
    room.send({ x: 1 });
  }

  function down () {
    room.send({ y: 1 })
  }

  function left () {
    room.send({ x: -1 })
  }