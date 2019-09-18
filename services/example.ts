import { Room } from "colyseus";

import { Config } from "./example/Config";
import { State } from "./example/State";


export class ExampleRoom extends Room<State> {
    
    metadata = {
        opened: false,
        name: ""
    }

    maxClients = 4;

    
    onInit (options:any) {
        this.roomId =  "g" + (Math.round( Math.random() * 60000) + 4096).toString(16);
        console.log("Created!", options);
        this.setState(new State());
        this.metadata.opened = true;
        this.state.addPortal(1,80,80); 
        this.state.addPortal(2,1000-80,80); 
        this.state.addPortal(3,80,1000-80); 
        this.state.addPortal(4,1000-80,1000-80); 
        for (var i=0;i<10; i++){
            this.state.addBlock(); 
        }
        this.state.addFlag(); 
    }

    onJoin (client) {
        this.state.createPlayer(client.sessionId);
    }

    requestJoin (options, isNewRoom: boolean) {
        if (options.id && options.id!=this.roomId){
            return false;
        }
        return (options.create)
            ? (options.create && isNewRoom)
            : this.clients.length > 0 && this.metadata.opened;
    }

    onLeave (client) {
        this.state.removePlayer(client.sessionId);
    }

    onMessage (client, data) {
        if (Config.DEBUG && data && !data.idle) {
            console.log(client.sessionId, ":", data);
        }
        this.state.movePlayer(client.sessionId, data);
        this.metadata.opened = this.state.opened;
    }

    onDispose () {
        console.log("Dispose");
    }

}