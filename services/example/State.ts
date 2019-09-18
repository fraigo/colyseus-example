import { type, MapSchema } from "@colyseus/schema";
import { Config } from "./Config"
import { Item } from "./Item"
import { Player } from "./Player"
import { Flag } from "./Flag"
import { Portal } from "./Portal"
import { Block } from "./Block"
import { GameState } from "./GameState"


export class State extends GameState {
    @type({ map: Player })
    players = new MapSchema<Player>();
    @type({ map: Item })
    items = new MapSchema<Item>();

    STATE_START = 0;
    STATE_PLAYING = 1;
    STATE_FINISH = 2;

    playerCount = 0;
    itemCount = 0;
    maxPlayers = 4;
    minPlayers = 1;
    playerSlots = [];
    state = this.STATE_START;
    opened = true;
    time = (new Date()).getTime();
    time12 = Math.round(this.time/80);
    time24 = Math.round(this.time/40);
    time40 = Math.round(this.time/25);
    last_time = this.time;
    diff = 0;
    
    createPlayer (id: string) {
        if (this.state == this.STATE_FINISH){
            return;
        }
        if (this.playerCount>=this.maxPlayers){
            return;
        }
        this.state = this.STATE_PLAYING;
        var index = this.playerCount;
        for(var i=0;i<this.maxPlayers;i++){
            if (!this.playerSlots[i]){
                index = i;
                break;
            }
        }
        var newItem = new Player();
        newItem.index =  index;
        newItem.label = "P" + index;
        newItem.sprite = "sprite" + (index+1);
        this.players[id] = newItem;
        this.playerSlots[index] = true;
        this.playerCount++;
        console.log("New player",index,this.playerCount);
    }

    removePlayer (id: string) {
        if (!this.players[id]){
            return;
        }
        if (this.players[id].flagTimeout>0){
            this.positionObject(this.items["flag"],100,100,900,800);
            this.items[ "flag" ].visible=true;
        }
        this.playerSlots[this.players[id].index]=false;
        delete this.players[id];
        this.playerCount--;
    }

    positionObject(obj: Item,x1:number,y1:number,x2:number,y2:number) {
        var ok=false;
        var retries=10;
        while (!ok){
            ok=true;
            retries--;
            if (retries==0){
                obj.visible=false;
                break;
            }
            obj.x=Math.floor(Math.random() * (x2-x1)) + x1;
            obj.y=Math.floor(Math.random() * (y2-y1)) + y1;
            for(var item in this.items){
                if (obj.id!=this.items[item].id && this.items[item].collission(obj)){
                    ok = false;
                    break;
                }
            }
        }
    }

    movePlayer (id: string, cmd: any) {
        this.last_time = this.time
        this.time = (new Date()).getTime();
        this.diff = this.time - this.last_time;
        this.time12 = Math.round(this.time/80);
        this.time24 = Math.round(this.time/40);
        this.time40 = Math.round(this.time/25);
        if (this.state != this.STATE_PLAYING){
            return;
        }
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
            if (player.portalTimeout<=0 &&  portal.collission(player)){
                portal.transportPlayer(player,this);
                break;
            }
        }
        if (cmd.x){
            player.vx=cmd.x;
        }else{
            player.vx=0;
        }
        if (cmd.y){
            player.vy=cmd.y;
        }else{
            player.vy=0;
        }
        for (var item in this.items){
            this.items[item].update(this);
        }
        for(var pid in this.players){
            var p1=this.players[pid];
            p1.move(this);
            if (pid!=id && this.players[id].collission(this.players[pid])){
                this.players[id].collisionWith(this.players[pid]);
            }
            this.players[pid].update(this);
            if (this.players[pid].points >= Config.WIN_POINTS){
                this.state = this.STATE_FINISH;
                this.players[pid].x=500;
                this.players[pid].y=500;
                this.players[pid].radius=100;
                this.players[pid].bgcolor="#fff";
                this.players[pid].label="Winner";
                this.opened = false;
            }
        }
    }

    addFlag (){
        var newItem = new Flag();
        this.items[ "flag" ] = newItem;
        this.positionObject(newItem,150,100,850,250);
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