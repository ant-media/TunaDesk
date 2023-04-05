/** 
 * Desktop control plugin get messages from WebRTCAdaptor and relays mouse/keyboards events to the
 * local nodejs application to simulate on the local computer
*/
import {WebRTCAdaptor} from "./node_modules/@antmedia/webrtc_adaptor/src/main/webapp/js/webrtc_adaptor.js";

export class DesktopControl {

    static DESKTOP_CONTROL_WEBSOCKET_URL = "ws://127.0.0.1:36000";

    constructor(webRTCAdaptor) {
        this.webRTCAdaptor = webRTCAdaptor;
        this.connected = false;
        this.connecting = false;

        this.webRTCAdaptor.addEventListener((event, object) => {
            if (event == "data_received") {
                console.debug("data received object");
                console.log(object);
                //object is a JSON object that has streamId and data fields
                this.remoteMessageReceived(event, object.data);
            }
        });
        this.connecting = true;
        this.websocketConnection = new WebSocket(DesktopControl.DESKTOP_CONTROL_WEBSOCKET_URL);
        this.websocketConnection.onopen = (event) => {
            this.websocketOnOpen(event);
        };  
        this.websocketConnection.onmessage = (event) => { 
            this.websocketOnMessage(event); 
        };
          
        this.websocketConnection.onclose = (event) => { 
            this.websocketOnClose(event) 
        };
          
        this.websocketConnection.onerror = (error) => { 
            this.websocketOnError(error);
        };
    }

    remoteMessageReceived(event, data) {
        if (this.connected) {
            this.websocketConnection.send(data);
        }
        else {
            if (!this.connecting) {
               this.connecting = true;
               this.websocketConnection = new WebSocket(DesktopControl.DESKTOP_CONTROL_WEBSOCKET_URL);
            }
        }
    }

    websocketOnOpen(event) {
        console.log("[open] Connection established");
        this.connected = true;
        this.connecting = false;
    }

    websocketOnMessage(event) {
        console.log(`[message] Data received from server: ${event.data}`);
    }

    websocketOnClose(event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
          } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            console.log('[close] Connection died');
          }
        this.connected = false;
        this.connecting = false;
    }

    websocketOnError (error) {
        console.log(`[error]`);
        this.connected = false;
        this.connecting = false;
    };

}

WebRTCAdaptor.register((webrtcAdaptorInstance) => {
    let desktopControl = new DesktopControl(webrtcAdaptorInstance);
});
