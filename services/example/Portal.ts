import { type } from "@colyseus/schema";
import { Item } from "./Item";
import { Config } from "./Config";
import { Player } from "./Player";
import { State } from "./State";

export class Portal extends Item {

    sprite = "portal1";
    spriteY = 1;
    width = 60;
    height = 60;
    radius = 10;
    type = "portal";
    
    @type("number")
    portalNumber = 0;

    @type("number")
    transferTimeout = 0;

    transportPlayer = function(player:Player, state:State){
        var portalNumber = this.portalNumber;
        while(portalNumber==this.portalNumber){
            portalNumber = Math.floor(Math.random()*4)+1;
        } 
        var newPortal = state.items["portal"+portalNumber];
        newPortal.transferTimeout = Config.TRANSFER_PORTAL_DURATION;
        this.transferTimeout = Config.TRANSFER_PORTAL_DURATION;
        player.x=newPortal.x;
        player.y=newPortal.y;
        player.portalTimeout = Config.TIMEOUT_TRANSFER_PORTAL;
        if (player.flagTimeout>0){
            player.flagTimeout = Math.max(1,player.flagTimeout - Config.FLAG_TIMEOUT_PENALTY);
        }
    }

    update = function(state:State){
        if (this.transferTimeout>0){
            this.spriteX = (state.time12) % 4;
            this.transferTimeout-=state.diff;
        }else{
            this.spriteX = 0;
            this.spriteY = 1;
        }
    }

}
