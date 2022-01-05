const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: ''
};

const dataWs = 'ws://localhost:2000/api';

// Create WebSocket connection.
const socket = new WebSocket(dataWs);

// Connection opened
socket.addEventListener('open', (event) => {
    socket.send(JSON.stringify('Ich eröffne die Verbindung!'));
});

// Listen for messages
socket.addEventListener('message', (event) => {
    console.log('Message from server: ', event.data);
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