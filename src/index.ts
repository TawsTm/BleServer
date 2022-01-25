import * as express from 'express';
import * as cors from 'cors';

import * as localtunnel from 'localtunnel';

import { WebSocketServer, WebSocket } from 'ws';
import * as numeric from 'numeric';


// Create the tunnel for localhost

(async () => {
  const tunnel: localtunnel.Tunnel = await localtunnel({ port: 3030, subdomain: 'blebeacon' });

  colorLog('green', 'The Tunnel is running on %s', tunnel.url);

  tunnel.on('close', () => {
    colorLog('red', 'Tunnel is closed!');
  });
})();

// Websocket approach

//let idList: string[] = [];
let deviceList: DeviceList[] = [];
let names: string[] = [];


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


let matrix2: number[][] = [];

let d1: DeviceList = {id: 'a', foundDevices: [{id: 'c', rssi: 3}, {id: 'e', rssi: 2}, {id: 'g', rssi: 1}], timeout: false};
let d2: DeviceList = {id: 'c', foundDevices: [{id: 'a', rssi: 3}, {id: 'e', rssi: 6}, {id: 'g', rssi: 7}], timeout: false};
let d3: DeviceList = {id: 'e', foundDevices: [{id: 'a', rssi: 2}, {id: 'c', rssi: 6}, {id: 'g', rssi: 3}], timeout: false};
let d4: DeviceList = {id: 'g', foundDevices: [{id: 'a', rssi: 1}, {id: 'c', rssi: 7}, {id: 'e', rssi: 3}], timeout: false};
let d5: DeviceList = {id: 'a2', foundDevices: [], timeout: false};

//let deviceList2: DeviceList[] = [d1, d2, d3, d4];

/**
 * 
 * @param initDevice the deviceList with all
 * @returns 
 */
function fillMatrix(initDevice: DeviceList[]): number[][] {
  let newMatrix: number[][] = [];
  for (let i: number = 0; i < initDevice.length; i++) {
    // Wir nehmen an das Array ist nach id Sortiert.
    // Jede Reihe wird einzeln befüllt.
    let row: number[] = [];
    //Schaue für jedes initialisierte Device an, welche Geräte es gefunden hat.
    let counter: number = 0;
    // Funktioniert nur, wenn die Geräteliste schon sortiert ankommt.
    initDevice[i].foundDevices.forEach(fdevice => {
      // Prüfe ob das gefundene Gerät auch wirklich der derzeitig initialisierten Geräteliste angehört.
      if (initDevice.some((device) =>
        device.id === fdevice.id
      )) {
        // Falls das Gerät in der Liste dem initialisierten Gerät entspricht setze den RSSI-Wert ein.
        while (fdevice.id != initDevice[counter].id && counter < initDevice.length) {
          // Check if opposite side has a Value and copy if possible.
          row.push(0);
          counter++;
        }
        if (counter > initDevice.length) {
          throw new Error('The counter is out of bounce and one device is not set yet!');
        } else {
          if (fdevice.rssi >= -30) {
            row.push(1);
          } else {
            // Gleiche aus, dass der RSSI-Wert zwischen -30 und -100 liegt, der Abstand bei -30 aber 0 betragen sollte.
            row.push(Math.abs(fdevice.rssi + 30));
          }
          
          counter++;
        }
      }
    });
    
    // Fülle 0er auf, falls alle gespeicherten Devices schon abgearbeitet sind.
    while (row.length < initDevice.length) {
      row.push(0);
    }
    if (row.length === initDevice.length) {
      // Wenn die Reihe genau so lang ist wie die angegebenen ID's, dann pushe
      newMatrix.push(row);
    } else {
      throw new Error('The Row-length exceeded the deviceList-length!');
    }
  }

  // Matrixkorrektur für 0-Stellen
  // prüft um rechenleistung zu sparen nur das rechte obere eck der Matrix bis zur Hauptdiagonalen.
  for (let i: number = 0; i < newMatrix.length - 1; i++) {
    for (let j: number = 1 + i; j < newMatrix[i].length; j++) {
      if (newMatrix[i][j] === 0 && newMatrix[j][i] != 0) {
        newMatrix[i][j] = newMatrix[j][i];
      } else if (newMatrix[j][i] === 0 && newMatrix[i][j] != 0) {
        newMatrix[j][i] = newMatrix[i][j];
      } else if (newMatrix[i][j] === 0 && newMatrix[j][i] === 0 && i != j) {
        // Der Wert welcher genutzt wird, wenn keines der beiden Geräte ein Signal vom jeweils anderen erhält.
        newMatrix[i][j] = newMatrix[j][i] = -100;
      }
    }
  }
  return newMatrix;
}

//addToDeviceList(d5);
//console.log('die Matrix: %o', fillMatrix(deviceList));
//setInterval(logMatrix, 2000);
//console.log(mds_classic(fillMatrix(deviceList)));

function logMatrix(): any {
  // TODO There could be 3 Devices but the Gradient would throw an error.
  if (deviceList.length > 3) {
    console.log(fillMatrix(deviceList));
    // Fill Matrix -> Use MDS -> Correct Coordinates in Result
    return correctGraph(mds_classic(fillMatrix(deviceList)));
  } else {
    return [];
  }
}

function heartbeat(this: any): void {
  this.isAlive = true;
}

// Set up server
const wssP: WebSocketServer = new WebSocketServer({ port: 3030 });

let pingInterval: NodeJS.Timer = setInterval(ping, 5000);

// To give every new connected client its unique id.
function getUniqueID(): string {
  // There are 16777215 possible ID's with 6 Hex-Numbers. Padding with 0 if code is too short.
  // The first 4 are reserved for fix Devices therefore we start at 4 till 16777214.
  let newID: string = (4 + Math.floor(Math.random() * 16777211)).toString(16).padStart(6, '0');

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
            element.foundDevices = jsonMessage.list;
            element.timeout = false;
          }
        });
      } else {
        // The Client already has an ID but is not registered in the Server.
        // The Player is just added to the List if he received some signal of another Player.
        if (!(jsonMessage.list === [])) {
          addToDeviceList({id: jsonMessage.id, foundDevices: jsonMessage.list, timeout: false});
          colorLog('green', 'Client first connect or reconnect after being disconnected');
        } else {
          colorLog('yellow', 'Player %s did not send any Data, maybe the Device is not advertising!', jsonMessage.id);
        }
      }
    }
    console.log('Derzeitige Liste: %o', deviceList);
    /*console.log('Erhalten von %s:', jsonMessage.id);
    console.log('Liste: %o', jsonMessage.list);*/
  });

  // Send a message
  ws.send('Hello client!');
});

/*console.log(
  // Sortieren nach Wert (Erst Zahlen dann Buchstaben)
  deviceList2.sort(function(a, b) {
    var nameA = a.id.toUpperCase(); // Groß-/Kleinschreibung ignorieren
    var nameB = b.id.toUpperCase(); // Groß-/Kleinschreibung ignorieren
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    // Namen müssen gleich sein
    return 0;
  })
);*/


/**
 * Diese Funktion sortiert das gegebene Element an die richtige Stelle im Array.
 * (Die Funktion könnte rechnerisch verbessert werden, indem man in der mitte des Arrays anfängt und sich so zu seinem Platz hin halbiert)
 * @param item 
 */
function addToDeviceList(item: DeviceList): void {

  deviceList.push(item);
  names.push('');
  let j: number = deviceList.length - 2;
  while ((j > -1) && (deviceList[j].id > item.id)) {
    deviceList[j + 1] = deviceList[j];
    names[j + 1] = names[j];
    j--;
  }
  deviceList[j + 1] = item;
  names[j + 1] = item.id;

}

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
    if (element.timeout) {
      deviceList.splice(index, 1);
      names.splice(index, 1);
    }
    element.timeout = true;
  });
}

wssP.on('close', function close(): void {
  clearInterval(pingInterval);
  colorLog('red', 'Connection closed!');
});

// So Typescript knows, that there is an extra boolean parameter.
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

// The List of all Connected Devices and their Devices in Range.
interface DeviceList {
  id: string;
  foundDevices: DeviceData[];
  timeout: boolean;
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
      ws.send(JSON.stringify({coordinatePoints: logMatrix(), names: names}));
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

    colorLog('green', 'WebClient: %o', jsonMessage);
    /*console.log('Erhalten von %s:', jsonMessage.id);
    console.log('Liste: %o', jsonMessage.list);*/
  });

  // Send a message
  ws.send(JSON.stringify({matrix: logMatrix(), names: names}));
});

wssC.on('close', function close(): void {
  clearInterval(pingInterval);
  colorLog('red', 'Connection closed!');
});

//*********************************************Graph Correction *******************************************************/

/**
   * This function allows to Correct the Graph Position on the Coordiante-System.
   * The first 4 Point are used to Align the Graph on the X and Y-Axis. Therefore 
   * the 4 Points should represent a sqaure and the 1st and 4th Point should be on 
   * opposite corners aswell as 2 and 3.
   * @param {number[][]} _points_data The Points on the Coordiante-System that need correction
   * @returns The new cerrocted Points.
   */
function correctGraph(_points_data: number[][]): number[][] {
  // Mittelpunkt zwischen Punkt 1 und 2
  const m1 = [(_points_data[0][0] + _points_data[1][0])/2, (_points_data[0][1] + _points_data[1][1])/2];

  // Mittelpunkt zwischen Punkt 3 und 4
  const m2 = [(_points_data[2][0] + _points_data[3][0])/2, (_points_data[2][1] + _points_data[3][1])/2];

  // Mittelpunkt zwischen Punkt 1 und 3
  const m3 = [(_points_data[0][0] + _points_data[2][0])/2, (_points_data[0][1] + _points_data[2][1])/2];

  // Mittelpunkt zwischen Punkt 2 und 4
  const m4 = [(_points_data[3][0] + _points_data[1][0])/2, (_points_data[3][1] + _points_data[1][1])/2];

  // Would show the points for the lines which determine the Gradient. If App crashes, note comments in drawGraph()
  /*_points_data.push(m1);
  _points_data.push(m2);
  _points_data.push(m3);
  _points_data.push(m4);*/

  // Steigung der m-Punkte berechnen
  let steigung1 = getGradient(m1, m2);
  let steigung2 = getGradient(m3, m4);

  // Den Radialen Grad der Steigung für beide geraden berechnen
  var degreeRad1 = Math.atan(steigung1);
  // In Radiant 90° are 1,5708, so we turn it around 90 degrees
  var degreeRad2 = Math.atan(steigung2) + (Math.PI/2);

  // Get the average degree to the x-Axis of both lines
  let degreeRad = ((modulo(degreeRad1, Math.PI) + modulo(degreeRad2, Math.PI))/2);


  /*if ((degreeRad1 > 0 && degreeRad2 < 0) || (degreeRad1 < 0 && degreeRad2 > 0)) {
    degreeRad += 1.5708;
  }*/
  
  console.log('Graph wurde um %s° gedreht', radians_to_degrees(degreeRad));

  // Falls m1 vor m2 liegt drehe den Winkel um 180°
  if (m2[0] > m1[0]) {
    degreeRad1 += Math.PI;
  }

  // Falls m3 vor m4 liegt drehe den Winkel um 180°
  if (m4[0] > m3[0]) {
    degreeRad2 += Math.PI;
  } else if(m2[0] > m1[0]) {
    degreeRad += Math.PI;
  }

  // Spiegelt den Graph, wenn der Winkel zwischen den Geradenrichtungen über 90° liegt.
  // Die Radiant-Werte müsste immer ungefähr eine Differenz von 2*1.57 aufweisen, falls die Punkte gespiegelt sind.
  // Mein Treshhold sind 1.57, d.h. alles was über 90° abweicht wird gespiegelt.
  // TODO Hier stimmt die umrechnung nicht! Man muss testen, welcher Punkt vor welchem liegt, da die Steigung nicht über 90 grad gehen kann.
  if (Math.abs(degreeRad1 - degreeRad2) >= 1.5708) {
    console.log('Die Punkte wurden gespiegelt');
    for (let i = 0; i < _points_data.length; i++) {
      _points_data[i][0] = -_points_data[i][0];
    }
    degreeRad = -degreeRad;
  }

  return rotate(degreeRad, _points_data);
}

/**
   * Hier wird die Steigung zwischen zwei Punkten berechnet.
   */
 function getGradient(_point1: number[], _point2: number[]) {
  return ((_point2[1] - _point1[1]) / (_point2[0] - _point1[0]));
}

/**
 * Hier wird eine Liste von Punkten um einen übergebenen Winkel gedreht.
 * @param {number} _rotation der Grad der Rotation aller Punkte um die x-Achse
 * @param {number[][]} _points Eine Liste der Punkte, welche gedreht werden sollen
 * @returns 
 */
function rotate(_rotation: number, _points: number[][]) {
  const rotateBack = -_rotation;
  let newPoints: number[][] = [];
  _points.forEach(point => {
    const x = point[0];
    const y = point[1];
    const newX = x*Math.cos(rotateBack) - y*Math.sin(rotateBack);
    const newY = x*Math.sin(rotateBack) + y*Math.cos(rotateBack);
    const newPoint = [newX, newY];
    newPoints.push(newPoint);
  });
  return newPoints;
}

/**
 * Converts radiant to degree
 * @param radians the radiant to be converted
 * @returns the value in degrees
 */
function radians_to_degrees(radians: number) {
  var pi = Math.PI;
  return radians * (180/pi);
}

/**
 * Modulo-extension for negative numbers.
 * @param {number} _m the number wich you want to use to Modulo on
 * @param {number} _n the cap
 * @returns modulo opertaion of m%n.
 */
function modulo(_m: number, _n: number) {
  return ((_m % _n) + _n) % _n;
}

// !This is just for a prettier Console.log

function colorLog(color: string, string: string, object?: string) {

  let red = '\x1b[31m';
  let green = '\x1b[32m';
  let yellow = '\x1b[33m';

  let standard = '\x1b[0m'; //To reset to default

  let choice = '';

  if (color === 'red') { //Green
    choice = red;
  } else if (color === 'green') {
    choice = green;
  } else if (color === 'yellow') {
    choice = yellow;
  }

  console.log(choice + string + standard, object);
}