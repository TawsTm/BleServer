// To enable correct implementation of Script-Tag in typescript
declare let d3: any;

let corrected: boolean = false;
let matrix: number[][] = [];
let coordinatesList: number[][][] = []; // stores a list of the last n Coordinates
let deviceList: DeviceList[] = [];

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


// ***** Server Communication *****

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: ''
};

const dataWs = 'ws://localhost:2000';

// Create WebSocket connection.
const socket = new WebSocket(dataWs);

// Connection opened
socket.addEventListener('open', (event) => {
    socket.send(JSON.stringify('Ich eröffne die Verbindung!'));
});

let counter = true;

// Listen for messages
socket.addEventListener('message', (event) => {
  //console.log('Message from server: ', event.data);
  if (event.data instanceof Blob) {
    console.log('DataPackage is empty!');
  } else {
    let json = JSON.parse(event.data);
    //console.log(json);

    // Use latest coordinates if Device-Count has changed.
    if(coordinatesList.length > 0 && (coordinatesList[coordinatesList.length-1].length !== json.coordinatePoints.length)) {
      console.log('Device-Count has changed!');
      coordinatesList = json.coordinatePoints;
    } else {
      if(coordinatesList.length > 40) {
        coordinatesList.shift();
      }
      coordinatesList.push(json.coordinatePoints);
    }
    const coordinates = averageCoordinates();
    const names = json.names;
    // add matrix to matrixList and calculate average matrix
    matrix = json.matrix;
    deviceList = json.deviceList;
    
    if (coordinates && coordinates.length >= 2) {
      
      // If the first 4 Devices are set, go correct the Graph.
      if (!(json.names[2] == '000002')) {
        console.log('Es sind keine 3 Devices als Eckpunkte eingetragen');
        corrected = false;
      } else {
        corrected = true;
      }
      drawGraph(coordinates, names);
    } else {
      console.log('Es sind nicht mindestens 3 Geräte verbunden.')
    }
  }
});

// Connection getting closed
socket.addEventListener('close', (event) => {
    socket.close();
    console.log('Connection is closed!');
});

// Error on Socket
socket.addEventListener('error', (error) => {
    socket.close();
    console.log('Connection closed because of error');
});

// ****** Now the d3 Presentation of the Data we received *******

//setInterval(drawGraph, 500);

/*m = [
  [ -17.697596586108375, -1 ],
  [ 20.871017496156938, 6.526468803426873 ],
  [ -5.700960434292957, -16.738520371506528 ]
];

drawGraph();*/

function drawGraph(_points_data: number[][], _names: string[]) {
  var MARGINX: any, MARGINY: any, enter_points: any, width: number, height: number, indicators: any,
  keys: string[], links: any, links_data: any, max_x: number, max_y: number, min_x: number, 
  min_y: number, points: any, points_data: any, svg: any, x: any, y: any;

  console.log('*********************NewLine*************************');
  console.table(_points_data);

  svg = d3.select('#map');
  svg.selectAll('*').remove();
  
  width = svg.node().getBoundingClientRect().width;

  height = svg.node().getBoundingClientRect().height;

  // Berechnung für die Seitenränder, damit Ausrichtungsecken immer ein Quadrat bilden.
  /* Damit der Graph mit einem gleichseitigen Dreieck richtig angezeigt wird, 
     muss die Höhe um Wurzel(3)/2 verringert werden, bzw. die Margin um den Counterfaktor 1.15472 erhöht werden.*/
  if (width >= height) {
    MARGINY = height/3 * 1.15473;
    MARGINX = height/3 + ((width - height)/2);
  } else {
    MARGINX = width/3 * 1.15473;
    MARGINY = width/3 + ((height - width)/2);
  }

  keys = _names;

  //m = matrix;

  points_data = _points_data;
  
  // The smallest and biggest x-Value is set.
  let corner_points: number[][];
  if (corrected) {
    corner_points = points_data.slice(0,3);
  } else {
    corner_points = points_data;
  }
  
  min_x = d3.min(corner_points, function(d: any) {
    return d[0];
  });
  max_x = d3.max(corner_points, function(d: any) {
    return d[0];
  });
  // The smallest and biggest y-Value is set.
  min_y = d3.min(corner_points, (d: any) =>
    d[1]
  );
  max_y = d3.max(corner_points, (d: any) =>
    d[1]
  );

  // Use middlePoints to determine the center of the Graph.
  const mid_x = (min_x + max_x)/2;
  const mid_y = (min_y + max_y)/2;
  const roomSize = 2;
  
  // The range of the values is set with the given svg-size
  x = d3.scale.linear().domain([mid_x+(roomSize/2), mid_x-(roomSize/2)]).range([MARGINX, width - MARGINX]);
  y = d3.scale.linear().domain([mid_y-(roomSize/2), mid_y+(roomSize/2)]).range([MARGINY, height - MARGINY]);

  links_data = [];

  //Dieser Code funktioniert, sobald die Helferpunkte nicht mehr zum Array hinzugefügt werden.
  // Und die Matrix müsste mit übergeben werden um mit alten distanzen zu vergleichen.
  /*points_data.forEach(function(p1, i1) {
    var array;
    array = [];
    points_data.forEach(function(p2, i2) {
      if (i1 !== i2) {
        return array.push({
          source: p1,
          target: p2,
          dist: m[i1][i2]
        });
      }
    });
    return links_data = links_data.concat(array);
  });

  links = svg.selectAll('.link').data(links_data);

  links.enter().append('line').attr({
    "class": 'link',
    x1: function(d) {
      return x(d.source[0]);
    },
    y1: function(d) {
      return y(d.source[1]);
    },
    x2: function(d) {
      return x(d.target[0]);
    },
    y2: function(d) {
      return y(d.target[1]);
    }
  });*/
  // Bis hier müsste der Code aukommentiert werden.

  points = svg.selectAll('.point').data(points_data);

  enter_points = points.enter().append('g').attr({
    "class": 'point',
    transform: function(d: any) {
      return "translate(" + (x(d[0])) + "," + (y(d[1])) + ")";
    }
  });

  enter_points.append('circle').attr({
    r: 6,
    opacity: 0.3
  });

  enter_points.append('circle').attr({
    fill: function(d: any, i: number) {
      if(i < 3 && corrected) {
        return '#ff0000';
      } else if (keys[i].length != 6) {
        console.log('Error: Die ID eines Spielers ist keine 4 Zeichen lang!');
      }
      return '#' +  keys[i];
    },
    r: 4
  });

  enter_points.append('text').text(function(d: any, i: number) {
    // TODO if the Code is in use p1-p4 should be named '' (nothing) so that they are clearly visible as markers
    /*if(i < 4 && corrected) {
      return '';
    }*/
    return keys[i];
  }).attr({
    y: 12,
    dy: '0.35em'
  });

  enter_points.append('title').text(function(d: any, i: number) {
    return d[0] + ", " + d[1];
  });

  indicators = svg.selectAll('.indicator').data(links_data);

  indicators.enter().append('circle').attr({
    "class": 'indicator',
    r: 5,
    cx: function(d: any) {
      var mul;
      mul = d.dist / Math.sqrt(Math.pow(d.target[1] - d.source[1], 2) + Math.pow(d.target[0] - d.source[0], 2));
      return x(d.source[0]) + mul * (x(d.target[0]) - x(d.source[0]));
    },
    cy: function(d: any) {
      var mul;
      mul = d.dist / Math.sqrt(Math.pow(d.target[1] - d.source[1], 2) + Math.pow(d.target[0] - d.source[0], 2));
      return y(d.source[1]) + mul * (y(d.target[1]) - y(d.source[1]));
    }
  });

  enter_points.on('click', function(d: any) {
    links.classed('visible', function(l: any) {
      return l.source === d;
    });
    return indicators.classed('visible', function(l: any) {
      return l.source === d;
    });
  });

}

function averageCoordinates(): number[][] {
  let newCoordinates: number[][] = []
  for (let i = 0; i < coordinatesList[coordinatesList.length-1].length; i++) {
    
    let averageX = 0;
    let averageY = 0;
    for (let j = 0; j < coordinatesList.length; j++) {
      // CoordinatenListe j an der Stelle i.
      const xCoordinate = coordinatesList[j][i][0];
      const yCoordinate = coordinatesList[j][i][1];
      averageX += xCoordinate;
      averageY += yCoordinate;
    }
    averageX = averageX / coordinatesList.length;
    averageY = averageY / coordinatesList.length;

    const newCoordinate = [averageX, averageY];
    newCoordinates.push(newCoordinate);
    
  }

  return newCoordinates;
}

function printMatrix() {
  console.table(matrix)
  console.table(deviceList);
}