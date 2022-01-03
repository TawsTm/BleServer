/*import * as express from 'express';
import * as cors from 'cors';*/

import { WebSocketServer, WebSocket } from 'ws';

// Websocket approach

//let idList: string[] = [];
let deviceList: DeviceList[] = [];

function heartbeat(this: any): void {
  this.isAlive = true;
}

// Set up server
const wss: WebSocketServer = new WebSocketServer({ port: 3000 });

let pingInterval = setInterval(ping, 5000);

// To give every new connected client its unique id.
function getUniqueID(): string {
  // There are 65535 possible ID's with 4 Hex-Numbers. Padding with 0 if code is too short.
  let newID = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');

  if (deviceList.some(element => element.id === newID)) {
    newID = getUniqueID();
  }

  return newID;
}

// Wire up some logic for the connection event (when a client connects) 
wss.on('connection', function connection(ws: WebSocket): void {
  
  //need to convert it to be Typescript conform
  const extWs: ExtWebSocket = ws as ExtWebSocket;
  
  //Ping to check if the Client is still part of the connection.
  extWs.isAlive = true;
  ws.on('pong', heartbeat);

  // Wire up logic for the message event (when a client sends something)
  ws.on('message', function incoming(message: string): void {
    const jsonMessage = JSON.parse(message);

    // Register if there is not already an id present.
    if (!jsonMessage.id) {
      const playerID = getUniqueID();
      // Send the Client his new ID
      ws.send(JSON.stringify({id: playerID}));
      //deviceList.push(jsonMessage);
      console.log('new ID was send!');
    } else {
      if (deviceList.some(element => element.id === jsonMessage.id)) {
        // *** Grenzfall: ID ist jemand anderem zugeteilt und man loggt sich mit der eigenen ID neue ein.***
        // If the Client is already registered and can just send Data.
        deviceList.some(element => { 
          if (element.id === jsonMessage.id) {
            element.devices = jsonMessage.list;
            element.timout = false;
          }
        });
      } else {
        // The Client already has an ID but is not registered in the Server anymore.
        deviceList.push({id: jsonMessage.id, devices: jsonMessage.list, timout: false});
        console.log('Client first connect or reconnect after being disconnected');
      }
    }
    console.log('Derzeitige Liste: %o', deviceList);
    /*console.log('Erhalten von %s:', jsonMessage.id);
    console.log('Liste: %o', jsonMessage.list);*/
  });

  // Send a message
  ws.send('Hello client!');
});

function ping(): void {
  // wss.clients.size return the amount of individual connections.
  console.log('Zurzeit sind so viele Geräte verbunden: ', wss.clients.size);
  wss.clients.forEach(function each(ws: WebSocket) {
    //need to convert it to be Typescript conform
    const extWs: ExtWebSocket = ws as ExtWebSocket;
    if (extWs.isAlive === false) {
      console.log('Connection was terminated!');
      return ws.terminate();
    } else {
      extWs.isAlive = false;
      extWs.ping();
      // There is no way to catch the ping event client sided so we have to send a message.
      ws.send('ping');
    }
  });


  // Jedes Device bekommt einen Timeout gesetzt, damit nicht mehr verbundene Devices aus der deviceList gelöscht werden können.
  // Somit wird geschaut ob ein Device innerhalb von 5 Sekunden reagiert hat, ansonsten wir es aus der Liste entfernt.
  deviceList.forEach((element, index) => {
    if (element.timout) {
      deviceList.splice(index, 1);
    }
    element.timout = true;
  });
}

wss.on('close', function close(): void {
  clearInterval(pingInterval);
  console.log('Connection closed!');
});

// So Typescript knows, that there is an extra boolean parameter.
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}


/*const app: express.Application = express();

app.use(cors());
app.use(express.json({limit: '1mb'}));

app.listen(3000, () => console.log('Dieser Server ist nicht für die Darstellung einer Website angedacht.'));

// List of all ID's that take part at the installation at this point.
let devices: string[] = [];
let newestID: string = '1234';

app.post('/api', (request: express.Request, response: express.Response) => {
    const requestData: UserData = request.body;

    // Decide if the request is an Update or a subscription cancel.
    const update: string = requestData.update;
    // Falls das Gerät noch nicht erfasst wurde, gib ihm eine ID, ansonsten sag ihm, das er schon erfasst wurde.
    const playerID: string = requestData.playerID;
    if (update === 'initialize') {
        if (!playerID) {
            response.json({
                type: 'init',
                newID: newestID
            });
            devices.push(newestID);
            console.log('new Player' + playerID + 'joined');
        } else {
            response.json({
                type: 'init',
                newID: 'already initialized'
            });
            console.log('Already initialized Device tried to init!');
        }
    } else if (update === 'update') {
        response.json({
            type: 'update',
            newID: ''
        });
        if (!devices.some(device => device === playerID)) {
            devices.push(playerID);
            console.log('Device was not in Serverlist, but already got an ID');
        } else {
            // Update the device RSSI.
        }
    } else if (update === 'cancel') {
        console.log('Player ' + playerID + ' canceled');
    } else {
        console.log('The update request (' + update + ') is not possible');
    }
});

app.get('/api', (request: express.Request, response: express.Response) => {
    response.json({
        status: 'Es sollte Post als Anfrage gestellt werden'
    });
    console.log(request.body);
});*/


// The List of all Connected Devices and their Devices in Range.
interface DeviceList {
  id: string;
  devices: DeviceData[];
  timout: boolean;
}

// One Data-Package of a Device in Range.
interface DeviceData {
  id: string;
  rssi: number;
}
  