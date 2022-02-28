# BleServer
A Server to handle requests of smartdevices that interact in a BLE Installation.

## Installation
To use this tool you need [Node.js](https://nodejs.org) installed on your machine. Go to the project folder and use

```
npm install
npm run build
```

in your console to install and build the tool. There could be some errors because of the linter that can be ignored for now.

## Start Server 
To start the server on Port 3030:
```
npm start run
```
or if nodemon is intalled you can auto reload with
```
nodemon start run
```
A localtunnel is created so that the WebSocket can be accessed via ws://blebeacon.loca.lt. If you use nodemon be aware that the address of the localtunnel may change on autoreload.

## Start Webvisualization

The index.html needs to be startet on a Live Server to catch the websocket on Port 2000
