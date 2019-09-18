import { Player } from "./Player"
import { Item } from "./Item"
import { Config } from "./Config"
import { State } from "./State"

export class Flag extends Item {

    sprite = "flag1";
    width = 60;
    height = 60;
    radius = 25;
    type = "flag";

    collisionWith = function(player:Player){
        this.visible=false;
        player.flagTimeout=Config.FLAG_TIMEOUT;
        player.stoleTimeout=Config.STOLE_TIMEOUT;
    }

    update = function(state:State){
        this.spriteX = state.time12 % 6;
    }
}