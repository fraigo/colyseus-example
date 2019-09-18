import { Schema, type } from "@colyseus/schema";
import { State } from "./State"

var itemCount = 0;

export class Item extends Schema {

    @type("number")
    id = (itemCount+=1);
    
    @type("number")
    index = 0;
    
    @type("number")
    x = 0;

    @type("number")
    y = 0;

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

    init (options:any) {
        if (options){
            for(var idx in options){
                this[idx] = options[idx];
            }    
        }
    }


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

    collisionWith = function(item:Item){

    }

    update = function(state:State){

    }

}


