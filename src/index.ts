import * as express from 'express';
import * as cors from 'cors';

import { WebSocketServer, RawData, WebSocket } from 'ws';

// Websocket approach

// Set up server
const wss: WebSocketServer = new WebSocketServer({ port: 3000 });

// Wire up some logic for the connection event (when a client connects) 
wss.on('connection', function connection(ws: WebSocket): void {

  // Wire up logic for the message event (when a client sends something)
  ws.on('message', function incoming(message: RawData): void {
    console.log('received: %s', message);
  });

  // Send a message
  ws.send('Hello client!');
});


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

interface UserData {
    playerID: string;
    update: string;
    deviceList: DevicePackage;
}

interface DevicePackage {
    canvasElement: HTMLElement;
    chart: any;
    device: any;
    rssi: number[];
    lifetime: number;
    playerID: string;
  }