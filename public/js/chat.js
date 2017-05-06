/* global window*/
class Chat {
  constructor(socket) {
    this.socket = socket;
  }
  sendMessage(room, text) {
    const message = { room, text };
    this.socket.emit('message', message);
  }
  changeRoom(room) {
    this.socket.emit('join', {
      newRoom: room,
    });
  }
  processCommand(command) {
    const words = command.split(' ');
    const action = words[0].substring(1, words[0].length).toLowerCase();
    let message = false;
    switch (action) {
      case 'join': {
        words.shift();
        const room = words.join(' ');
        this.changeRoom(room);
        break;
      }
      case 'nick': {
        words.shift();
        const name = words.join(' ');
        this.socket.emit('nameAttempt', name);
        break;
      }
      default: {
        message = 'Unrecognized command';
        break;
      }
    }
    return message;
  }
}
window.Chat = Chat;
