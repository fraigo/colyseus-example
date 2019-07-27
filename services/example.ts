import { Room } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";
import { Item, GameState } from "./common/Item";

var COLORS = ['red', 'green', 'yellow', 'blue', 'cyan', 'magenta'];
var FLAG_TIMEOUT = 250;
var STOLE_TIMEOUT = 50;

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
    portalTimeout = 0;

    @type("number")
    points = 0;

    collisionWith = function(player: Player){
        console.log(player.id + " collition " + this.id);
        if (this.flagTimeout && this.stoleTimeout==0){
            console.log(player.id + " stole " + this.id);
            this.flagTimeout=0;
            player.flagTimeout=FLAG_TIMEOUT;
            player.stoleTimeout=STOLE_TIMEOUT;
        }
        else if (player.flagTimeout && player.stoleTimeout==0){
            console.log(this.id + " stole " + player.id);
            player.flagTimeout=0;
            this.flagTimeout=FLAG_TIMEOUT;
            this.stoleTimeout=STOLE_TIMEOUT;
        }
    }

    update = function(state:State){
        if (this.stoleTimeout){
            this.stoleTimeout--;
        }
        if (this.portalTimeout){
            this.portalTimeout--;
        }
        if (this.flagTimeout){
            this.flagTimeout--;
            if (this.flagTimeout==0){
                state.positionObject(state.items["flag"],150,100,850,800);
                state.items[ "flag" ].visible=true;
            }
        }
        if (this.flagTimeout){
            this.points+=0.1;
            this.label=""+Math.round(this.points)
        }
        this.spriteX = (this.spriteX+1) % 3;
    }

    move = function(x:number,y:number){
        var vel = this.flagTimeout ? 8 : 10;
        var radius = this.radius;
        if (x) {
            var oldX=this.x;
            this.x += x * vel;
            var newX = this.x ;
            for (var item in this.items){
                if (this.items[item].type=="block" && this.items[item].collission(this)){
                    this.x = oldX;
                }
            }
            if (newX < radius || newX > 1000-radius){
                this.x = oldX;
            }
            if (x>0){
                this.spriteY = 2; 
            }else{
                this.spriteY = 1; 
            }

        } else if (y) {
            var oldY=this.y;
            this.y += y * vel;
            var newY=this.y;
            for (var item in this.items){
                if (this.items[item].type=="block" && this.items[item].collission(this)){
                    this.y = oldY;
                    break;
                }
            }
            if (newY < radius || newY > 1000-radius){
                this.y = oldY;
            }
            if (y>0){
                this.spriteY = 0; 
            }else{
                this.spriteY = 3; 
            }
        }
    }

}

export class Portal extends Item {

    sprite = "portal1";
    width = 60;
    height = 60;
    radius = 10;
    type = "portal";
    
    @type("number")
    portalNumber = 0;

    transportPlayer = function(player:Player, state:State){
        var portalNumber = this.portalNumber;
        while(portalNumber==this.portalNumber){
            portalNumber = Math.floor(Math.random()*4)+1;
        } 
        var newPortal = state.items["portal"+portalNumber];
        player.x=newPortal.x;
        player.y=newPortal.y;
        player.portalTimeout=40;
    }



}

export class Block extends Item {

    sprite = "block1";
    width = 40;
    height = 40;
    radius = 15;
    type = "block";

}

export class Flag extends Item {

    sprite = "flag1";
    width = 60;
    height = 60;
    radius = 25;
    type = "flag";

    collisionWith = function(player:Player){
        this.visible=false;
        player.flagTimeout=FLAG_TIMEOUT;
        player.stoleTimeout=STOLE_TIMEOUT;
    }

}

export class State extends GameState {
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
        if (this.items["flag"].collission(player)){
            this.items["flag"].collisionWith(player);
        }
        for(var i=1;i<=4;i++){
            var portal = this.items["portal"+i];
            if (!player.portalTimeout &&  portal.collission(player)){
                portal.transportPlayer(player,this);
                break;
            }
        }
        player.move(movement.x,movement.y);
        for(var pid in this.players){
            if (pid!=id && this.players[id].collission(this.players[pid])){
                this.players[id].collisionWith(this.players[pid]);
            }
            this.players[pid].update(this);
        }
        this.items[ "flag" ].spriteX = (this.items[ "flag" ].spriteX+1) % 6;
    }

    addFlag (){
        var newItem = new Flag();
        newItem.y = Math.floor(Math.random() * 100) + 100;
        this.items[ "flag" ] = newItem;
    }

    addPortal (id:number,x:number,y:number){
        var newItem = new Portal();
        newItem.x = x;
        newItem.y = y;
        newItem.portalNumber = id;
        this.items[ "portal"+id ] = newItem;
    }

    addBlock (){
        var newItem = new Block();
        newItem.x = Math.floor(Math.random() * 800) + 100;
        newItem.y = Math.floor(Math.random() * 600) + 200;
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