/* eslint arrow-parens: ["error", "as-needed"]*/
const socketio = require('socket.io');

let io = {};
let guestNumber = 1;
const nicknames = {};
const namesUsed = [];
const currentRoom = {};

function assignGuestName(socket, gstNbr) {
  const name = `Guest${gstNbr}`;
  nicknames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name,
  });
  namesUsed.push(name);
  return gstNbr + 1;
}

function joinRoom(socket, room = 'Lobby') {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', { room });
  socket.broadcast.to(room).emit('message', {
    text: `${nicknames[socket.id]} has joined ${room}.`,
  });
  const usersInRoom = io.of('/').in(room).clients;

  if (usersInRoom.length > 1) {
    let usersInRoomSummary = `Users currently in ${room}: `;
    let userSocketId = {};
    Object.keys(usersInRoom).forEach(index => {
      userSocketId = usersInRoom[index].id;
      if (userSocketId !== socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += nicknames[userSocketId];
      }
    });
    usersInRoomSummary += '.';
    socket.emit('message', { text: usersInRoomSummary });
  }
}

function handleMessageBroadcasting(socket) {
  socket.on('message', message => {
    console.log(`message broadcast ${message.text}`);
    console.log(`current room is ${currentRoom[socket.id]}`);
    socket.broadcast.to(currentRoom[socket.id]).emit('message', {
      text: `${nicknames[socket.id]}: ${message.text}`,
    });
  });
}

function handleNameChangeAttempts(socket) {
  socket.on('nameAttempt', name => {
    if (name.indexOf('Guest') === 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".',
      });
    } else if (namesUsed.indexOf(name) === -1) {
      const prevName = nicknames[socket.id];
      const prevNameIndx = namesUsed.indexOf(prevName);
      namesUsed.push(name);
      nicknames[socket.id] = name;
      delete namesUsed[prevNameIndx];
      socket.emit('nameResult', { success: true, name });
      socket.broadcast.to(currentRoom[socket.id]).emit('message', {
        text: `${prevName} is now known as ${name}.`,
      });
    } else {
      socket.emit('nameResult', {
        success: false,
        message: 'Name is already in use.',
      });
    }
  });
}

function handleRoomJoining(socket) {
  socket.on('join', room => {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}
function handleClientDisconnect(socket) {
  socket.on('disconnect', () => {
    const nameInd = namesUsed.indexOf(nicknames[socket.id]);
    delete namesUsed[nameInd];
    delete nicknames[socket.id];
  });
}
module.exports.listen = server => {
  console.log('entered chatServer');
  // Start socketio server allowing it to piggy bank on exiting http server
  io = socketio.listen(server);
  io.set('log level', 1);
  // handle definition each socket of user interaction
  io.sockets.on('connection', socket => {
    // Assign a guestname whenever a user connects
    guestNumber = assignGuestName(socket, guestNumber);
    // Place user in a room when they connect
    joinRoom(socket, 'Lobby');

    // Handle user messages, name-change attempts and room creation/changes
    handleMessageBroadcasting(socket, nicknames);
    handleNameChangeAttempts(socket, nicknames, namesUsed);
    handleRoomJoining(socket);

    // Provide user with list of occupied rooms on request
    socket.on('rooms', () => {
      socket.emit('rooms', io.of('/').adapter.rooms);
    });
    // Define clean up logic when user disconnects
    handleClientDisconnect(socket, nicknames, namesUsed);
  });
};
