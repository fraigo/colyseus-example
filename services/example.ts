import { Room } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

var colors = ['red', 'green', 'yellow', 'blue', 'cyan', 'magenta'];
var FLAG_TIMEOUT = 250;
var STOLE_TIMEOUT = 30;

export class Item extends Schema {
    @type("number")
    index = 0;
    
    @type("number")
    x = Math.floor(Math.random() * 800) + 100;

    @type("number")
    y = Math.floor(Math.random() * 700) + 200;

    @type("number")
    radius = 10;

    @type("number")
    width = 0;

    @type("number")
    height = 0;

    @type("number")
    health = 100;

    @type("string")
    label = "";

    @type("string")
    type = "item";

    @type("string")
    bgcolor = null;

    @type("number")
    fontSize = 30;

    @type("boolean")
    visible = true;

    @type("string")
    sprite = "";

    @type("number")
    spriteX = 0;
    
    @type("number")
    spriteY = 0;


    collission = function(item: Item){
        var radius=0;
        if (!this.visible || !item.visible){
            return false;
        }
        if (this.radius && item.radius){
            radius = this.radius+item.radius;
        }
        if (radius){
            var dist2=(this.x-item.x)*(this.x-item.x)+(this.y-item.y)*(this.y-item.y);
            return dist2<radius*radius;
        }
        return false;
    }

}

export class Player extends Item {
    
    type = "player";
    width = 60;
    height = 60;
    radius = 25;
    x = Math.floor(Math.random() * 800) + 100;
    y = Math.floor(Math.random() * 100) + 800;

    @type("number")
    flagTimeout = 0;

    @type("number")
    stoleTimeout = 0;

    @type("number")
    points = 0;

    
}


export class State extends Schema {
    @type({ map: Player })
    players = new MapSchema<Player>();
    @type({ map: Item })
    items = new MapSchema<Item>();

    playerCount = 0;
    itemCount = 0;
    maxPlayers = 4;
    minPlayers = 1;
    playerSlots = [];

    createPlayer (id: string) {
        if (this.playerCount>=this.maxPlayers){
            return;
        }
        var index = this.playerCount;
        for(var i=0;i<this.maxPlayers;i++){
            if (!this.playerSlots[i]){
                index = i;
                break;
            }
        }
        console.log("New slot",index,this.playerCount);
        var newItem = new Player();
        newItem.index =  index;
        newItem.label = "P" + index;
        newItem.sprite = "sprite" + (index+1);
        this.players[id] = newItem;
        this.playerSlots[index] = true;
        this.playerCount++;
    }

    removePlayer (id: string) {
        if (!this.players[id]){
            return;
        }
        if (this.players[id].flagTimeout){
            this.positionObject(this.items["flag"],100,100,900,800);
            this.items[ "flag" ].visible=true;
        }
        this.playerSlots[this.players[id].index]=false;
        delete this.players[id];
        this.playerCount--;
    }

    positionObject(obj: Item,x1:number,y1:number,x2:number,y2:number) {
        var ok=false;
        while (!ok){
            ok=true;
            obj.x=Math.floor(Math.random() * (x2-x1)) + x1;
            obj.y=Math.floor(Math.random() * (y2-y1)) + y1;
            for(var item in this.items){
                if (this.items[item].collission(obj)){
                    console.log("Failed "+obj.x+":"+obj.y);
                    ok = false;
                    break;
                }
            }
        }
    }

    movePlayer (id: string, movement: any) {
        if (this.playerCount<this.minPlayers){
            return;
        }
        var player=this.players[id];
        if (!player){
            return;
        }
        this.players[id].spriteX = (this.players[id].spriteX+1) % 3;
        var vel = this.players[id].flagTimeout ? 8 : 10;
        var radius = this.players[id].radius;
        if (movement.x) {
            var oldX=this.players[id].x;
            this.players[id].x += movement.x * vel;
            var newX = this.players[id].x ;
            for (var item in this.items){
                if (this.items[item].type=="block" && this.items[item].collission(this.players[id])){
                    this.players[id].x = oldX;
                }
            }
            if (newX < radius || newX > 1000-radius){
                this.players[id].x = oldX;
            }
            if (movement.x>0){
                this.players[id].spriteY = 2; 
            }else{
                this.players[id].spriteY = 1; 
            }

        } else if (movement.y) {
            var oldY=this.players[id].y;
            this.players[id].y += movement.y * vel;
            var newY=this.players[id].y;
            for (var item in this.items){
                if (this.items[item].type=="block" && this.items[item].collission(this.players[id])){
                    this.players[id].y = oldY;
                    break;
                }
            }
            if (newY < radius || newY > 1000-radius){
                this.players[id].y = oldY;
            }
            if (movement.y>0){
                this.players[id].spriteY = 0; 
            }else{
                this.players[id].spriteY = 3; 
            }
        }
        if (this.items["flag"].collission(this.players[id])){
            this.items["flag"].visible=false;
            this.players[id].flagTimeout=FLAG_TIMEOUT;
            this.players[id].stoleTimeout=STOLE_TIMEOUT;
        }
        for(var i=1;i<=4;i++){
            if (!this.players[id].portalTimeout &&  this.items["portal"+i].collission(this.players[id])){
                var newPortal = Math.floor(Math.random()*4)+1; 
                this.players[id].x=this.items["portal"+newPortal].x;
                this.players[id].y=this.items["portal"+newPortal].y;
                this.players[id].portalTimeout=20;
                console.log("Portal",i);
                break;
            }
        }
        for(var pid in this.players){
            if (pid!=id && this.players[id].collission(this.players[pid])){
                if (this.players[id].flagTimeout && this.players[id].stoleTimeout==0){
                    this.players[id].flagTimeout=0;
                    this.players[pid].flagTimeout=FLAG_TIMEOUT;
                    this.players[pid].stoleTimeout=STOLE_TIMEOUT;
                }
                if (this.players[pid].flagTimeout && this.players[pid].stoleTimeout==0){
                    this.players[pid].flagTimeout=0;
                    this.players[id].flagTimeout=FLAG_TIMEOUT;
                    this.players[id].stoleTimeout=STOLE_TIMEOUT;
                }
            }
            if (this.players[pid].stoleTimeout){
                this.players[pid].stoleTimeout--;
            }
            if (this.players[pid].portalTimeout){
                this.players[pid].portalTimeout--;
            }
            if (this.players[pid].flagTimeout){
                this.players[pid].flagTimeout--;
                if (this.players[pid].flagTimeout==0){
                    this.positionObject(this.items["flag"],100,100,900,800);
                    this.items[ "flag" ].visible=true;
                }
            }
            if (this.players[id].flagTimeout){
                this.players[id].points+=0.1;
                this.players[id].label=""+Math.round(this.players[id].points)
            }
        }
        this.items[ "flag" ].spriteX = (this.items[ "flag" ].spriteX+1) % 6;
    }

    addFlag (){
        var newItem = new Item();
        newItem.sprite = "flag1";
        newItem.width = 60;
        newItem.height = 60;
        newItem.radius = 25;
        newItem.type = "flag";
        newItem.y = Math.floor(Math.random() * 100) + 100;
        this.items[ "flag" ] = newItem;
    }

    addPortal (id:number,x:number,y:number){
        var newItem = new Item();
        newItem.sprite = "portal1";
        newItem.width = 60;
        newItem.height = 60;
        newItem.radius = 10;
        newItem.x = x;
        newItem.y = y;
        newItem.type = "portal";
        this.items[ "portal"+id ] = newItem;
    }

    addBlock (){
        var newItem = new Item();
        newItem.sprite = "block1";
        newItem.width = 40;
        newItem.height = 40;
        newItem.radius = 15;
        newItem.x = Math.floor(Math.random() * 800) + 100;
        newItem.y = Math.floor(Math.random() * 600) + 200;
        newItem.type = "block";
        var index = Object.keys(this.items).length;
        this.items[ "block"+index ] = newItem;
    }
}

export class ExampleRoom extends Room<State> {
    onInit (options) {
        console.log("ExampleRoom created!", options);

        this.setState(new State());
        this.state.addFlag(); 
        this.state.addPortal(1,80,80); 
        this.state.addPortal(2,1000-80,80); 
        this.state.addPortal(3,80,1000-80); 
        this.state.addPortal(4,1000-80,1000-80); 
        for (var i=0;i<10; i++){
            this.state.addBlock(); 
        }
    }

    onJoin (client) {
        this.state.createPlayer(client.sessionId);
    }

    onLeave (client) {
        this.state.removePlayer(client.sessionId);
    }

    onMessage (client, data) {
        console.log("ExampleRoom received ", client.sessionId, ":", data);
        this.state.movePlayer(client.sessionId, data);
    }

    onDispose () {
        console.log("Dispose ExampleRoom");
    }

}