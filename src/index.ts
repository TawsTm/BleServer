import * as express from 'express';
import * as cors from 'cors';

import { WebSocketServer, WebSocket } from 'ws';
import * as numeric from 'numeric';

// Websocket approach

//let idList: string[] = [];
let deviceList: DeviceList[] = [];


// exports of the catched devices in matrix form.
let matrix: number[][] = [
  [0, 587, 1212, 701, 1936, 604, 748, 2139, 2182, 543], 
  [587, 0, 920, 940, 1745, 1188, 713, 1858, 1737, 597], 
  [1212, 920, 0, 879, 831, 1726, 1631, 949, 1021, 1494], 
  [701, 940, 879, 0, 1374, 968, 1420, 1645, 1891, 1220], 
  [1936, 1745, 831, 1374, 0, 2339, 2451, 347, 959, 2300], 
  [604, 1188, 1726, 968, 2339, 0, 1092, 2594, 2734, 923], 
  [748, 713, 1631, 1420, 2451, 1092, 0, 2571, 2408, 205], 
  [2139, 1858, 949, 1645, 347, 2594, 2571, 0, 678, 2442], 
  [2182, 1737, 1021, 1891, 959, 2734, 2408, 678, 0, 2329], 
  [543, 597, 1494, 1220, 2300, 923, 205, 2442, 2329, 0]
];
// dependant on the matrix, this array has to be in correct order.
let devices: string[] = ['Atlanta', 'Chicago', 'Denver', 'Houston', 'Los Angeles', 'Miami', 'New York', 'San Francisco', 'Seattle', 'Washington, DC'];

function heartbeat(this: any): void {
  this.isAlive = true;
}

// Set up server
const wssP: WebSocketServer = new WebSocketServer({ port: 3000 });

let pingInterval: NodeJS.Timer = setInterval(ping, 5000);

// To give every new connected client its unique id.
function getUniqueID(): string {
  // There are 65535 possible ID's with 4 Hex-Numbers. Padding with 0 if code is too short.
  let newID: string = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');

  if (deviceList.some(element => element.id === newID)) {
    newID = getUniqueID();
  }

  return newID;
}

// Wire up some logic for the connection event (when a client connects) 
wssP.on('connection', function connection(ws: WebSocket): void {
  
  //need to convert it to be Typescript conform
  const extWs: ExtWebSocket = ws as ExtWebSocket;
  
  //Ping to check if the Client is still part of the connection.
  extWs.isAlive = true;
  ws.on('pong', heartbeat);

  // Wire up logic for the message event (when a client sends something)
  ws.on('message', function incoming(message: string): void {
    const jsonMessage: any = JSON.parse(message);

    // Register if there is not already an id present.
    if (!jsonMessage.id) {
      const playerID: string = getUniqueID();
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
  // wssP.clients.size return the amount of individual connections.
  console.log('Zurzeit sind so viele Geräte verbunden: ', wssP.clients.size);
  wssP.clients.forEach(function each(ws: WebSocket) {
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

wssP.on('close', function close(): void {
  clearInterval(pingInterval);
  console.log('Connection closed!');
});

// So Typescript knows, that there is an extra boolean parameter.
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

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

//*************************************From now on the Supervisor Server************************************** */

/**
 * To Calculate the Multi Dimensional Scaling.
 * @param distances is the Matrix of all the Points collected
 * @param dimensions should be 2, represents 2D or 3D
 * @returns an Array with all the Distancevektors.
 */
function mds_classic(distances: any, dimensions: number = 2): any {

  // square distances
  var M: any = numeric.mul(-.5, numeric.pow(distances, 2));

  // double centre the rows/columns
  function mean(A: any): any { return numeric.div(numeric.add.apply(null, A), A.length); }
  var rowMeans: any = mean(M),
      colMeans: any = mean(numeric.transpose(M)),
      totalMean: any = mean(rowMeans);

  for (var i = 0; i < M.length; ++i) {
      for (var j: number = 0; j < M[0].length; ++j) {
          M[i][j] += totalMean - rowMeans[i] - colMeans[j];
      }
  }

  // take the SVD of the double centred matrix, and return the
  // points from it
  var ret: any = numeric.svd(M),
      eigenValues: any = numeric.sqrt(ret.S);
  return ret.U.map(function (row: any): any {
      return numeric.mul(row, eigenValues).splice(0, dimensions);
  });
}

// Update den Clienten alle 500ms
let updateGraphInterval: NodeJS.Timer = setInterval(updateGraph, 500);

function updateGraph(): void {
  // wssP.clients.size return the amount of individual connections.
  wssC.clients.forEach(function each(ws: WebSocket) {
      ws.send(JSON.stringify(mds_classic(matrix)));
  });
}

// Set up server
const wssC: WebSocketServer = new WebSocketServer({ port: 2000 });

// Wire up some logic for the connection event (when a client connects) 
wssC.on('connection', function connection(ws: WebSocket): void {
  
  //need to convert it to be Typescript conform
  const extWs: ExtWebSocket = ws as ExtWebSocket;

  // Wire up logic for the message event (when a client sends something)
  ws.on('message', function incoming(message: string): void {
    const jsonMessage: any = JSON.parse(message);

    console.log('Derzeitige Liste: %o', jsonMessage);
    /*console.log('Erhalten von %s:', jsonMessage.id);
    console.log('Liste: %o', jsonMessage.list);*/
  });

  // Send a message
  ws.send(JSON.stringify(mds_classic(matrix)));
});

wssC.on('close', function close(): void {
  clearInterval(pingInterval);
  console.log('Connection closed!');
});