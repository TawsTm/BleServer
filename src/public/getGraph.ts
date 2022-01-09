let m: number[][] = [];
let names: string[] = [];


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
        console.log(json);
        m = json.matrix;
        names = json.names;
        if (m.length > 2) {
            console.log('This is the Matrix: %o', m);
            drawGraph();
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


function drawGraph() {
    if (m.length > 2) {
    var MARGIN, enter_points, height, indicators, keys, links, links_data, max_x, max_y, min_x, min_y, points, points_data, svg, width, x, y;
  
    MARGIN = 100;
  
    svg = d3.select('svg');

    svg.selectAll('*').remove();
  
    width = svg.node().getBoundingClientRect().width;
  
    height = svg.node().getBoundingClientRect().height;
  
    //keys = ['Atlanta', 'Chicago', 'Denver', 'Houston', 'Los Angeles', 'Miami', 'New York', 'San Francisco', 'Seattle', 'Washington, DC'];

    keys = names;
  
    /*m = [
        [ -17.697596586108375, counter ],
        [ 20.871017496156938, 6.526468803426873 ],
        [ -5.700960434292957, -16.738520371506528 ]
      ]
      ;*/
    points_data = m;
    console.log(m);
  
    min_x = d3.min(points_data, function(d) {
      return d[0];
    });
  
    max_x = d3.max(points_data, function(d) {
      return d[0];
    });
  
    min_y = d3.min(points_data, function(d) {
      return d[1];
    });
  
    max_y = d3.max(points_data, function(d) {
      return d[1];
    });
  
    x = d3.scale.linear().domain([max_x, min_x]).range([MARGIN, width - MARGIN]);
  
    y = d3.scale.linear().domain([min_y, max_y]).range([MARGIN, height - MARGIN]);
  
    links_data = [];
  
    points_data.forEach(function(p1, i1) {
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
    });
  
    points = svg.selectAll('.point').data(points_data);
  
    enter_points = points.enter().append('g').attr({
      "class": 'point',
      transform: function(d) {
        return "translate(" + (x(d[0])) + "," + (y(d[1])) + ")";
      }
    });
  
    enter_points.append('circle').attr({
      r: 6,
      opacity: 0.3
    });
  
    enter_points.append('circle').attr({
      r: 4
    });
  
    enter_points.append('text').text(function(d, i) {
      return keys[i];
    }).attr({
      y: 12,
      dy: '0.35em'
    });
  
    enter_points.append('title').text(function(d, i) {
      return d[0] + ", " + d[1];
    });
  
    indicators = svg.selectAll('.indicator').data(links_data);
  
    /*indicators.enter().append('circle').attr({
      "class": 'indicator',
      r: 5,
      cx: function(d) {
        var mul;
        mul = d.dist / Math.sqrt(Math.pow(d.target[1] - d.source[1], 2) + Math.pow(d.target[0] - d.source[0], 2));
        return x(d.source[0]) + mul * (x(d.target[0]) - x(d.source[0]));
      },
      cy: function(d) {
        var mul;
        mul = d.dist / Math.sqrt(Math.pow(d.target[1] - d.source[1], 2) + Math.pow(d.target[0] - d.source[0], 2));
        return y(d.source[1]) + mul * (y(d.target[1]) - y(d.source[1]));
      }
    });*/
  
    enter_points.on('click', function(d) {
      links.classed('visible', function(l) {
        return l.source === d;
      });
      return indicators.classed('visible', function(l) {
        return l.source === d;
      });
    });
    }
  
  }