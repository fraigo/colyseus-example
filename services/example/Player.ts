import { type, MapSchema } from "@colyseus/schema";
import { Item } from "./Item";
import { Config } from "./Config"
import { State } from "./State"

export class Player extends Item {
    
    type = "player";
    width = 60;
    height = 60;
    radius = 25;
    x = Math.floor(Math.random() * 800) + 100;
    y = Math.floor(Math.random() * 100) + 800;
    vx = 0;
    vy = 0;

    @type("number")
    flagTimeout = 0;

    @type("number")
    stoleTimeout = 0;

    @type("number")
    portalTimeout = 0;

    @type("number")
    points = 0;

    @type({ map: Item})
    items = new MapSchema<Item>();

    collisionWith = function(player: Player){
        if (this.flagTimeout>0 && this.stoleTimeout<=0){
            this.flagTimeout=0;
            player.flagTimeout=Config.FLAG_TIMEOUT;
            player.stoleTimeout=Config.STOLE_TIMEOUT;
        }
        else if (player.flagTimeout>0 && player.stoleTimeout<=0){
            player.flagTimeout=0;
            this.flagTimeout=Config.FLAG_TIMEOUT;
            this.stoleTimeout=Config.STOLE_TIMEOUT;
        }
    }

    update = function(state:State){
        if (this.stoleTimeout>0){
            this.stoleTimeout-=state.diff;
        }
        if (this.portalTimeout>0){
            this.portalTimeout-=state.diff;
        }
        if (this.flagTimeout>0){
            this.flagTimeout-=state.diff;
            if (this.flagTimeout<=0){
                state.positionObject(state.items["flag"],150,100,850,800);
                state.items[ "flag" ].visible=true;
            }
        }
        if (this.flagTimeout>0){
            this.points+=state.diff/1000;
            this.label=""+Math.round(this.points)
            var obj=this.items["flag"];
            if (!obj){
                obj=new Item();
                obj.init({
                    sprite:"flag1",
                    width:Math.round(this.width/2),
                    height:Math.round(this.height/2)
                });  
                this.items["flag"]=obj;
            }
            obj.spriteX = state.time12 % 6;  
            obj.x=Math.round(this.width/2);
            obj.y=-Math.round(this.height/2);
        }else{
            delete this.items["flag"];
        }
        if (this.stoleTimeout>0){
            var obj=this.items["bubble"];
            if (!obj){
                obj=new Item();
                obj.init({
                    sprite:"bubble1",
                    width:Math.round(this.width*1.2),
                    height:Math.round(this.height*1.2)
                })
                this.items["bubble"]=obj;
            }
            obj.x=0;
            obj.y=0;
        }else{
            delete this.items["bubble"];
        }
    }

    move = function(state:State){
        var vel = this.flagTimeout>0 ? state.diff/5 : state.diff/4;
        var radius = this.radius;
        if (this.vx) {
            var oldX=this.x;
            this.x += this.vx * vel;
            var newX = this.x ;
            for (var item in state.items){
                if (state.items[item].type=="block" && state.items[item].collission(this)){
                    this.x = oldX;
                }
            }
            if (newX < radius || newX > 1000-radius){
                this.x = oldX;
            }else{
                this.spriteX = (this.spriteX+1) % 3;
            }
            if (this.vx>0){
                this.spriteY = 2; 
            }else{
                this.spriteY = 1; 
            }

        } 
        if (this.vy) {
            var oldY=this.y;
            this.y += this.vy * vel;
            var newY=this.y;
            for (var item in state.items){
                if (state.items[item].type=="block" && state.items[item].collission(this)){
                    this.y = oldY;
                    break;
                }
            }
            if (newY < radius || newY > 1000-radius){
                this.y = oldY;
            }else{
                this.spriteX = (this.spriteX+1) % 3;
            }
            if (this.vy>0){
                this.spriteY = 0; 
            }else{
                this.spriteY = 3; 
            }
        }
    }

}
