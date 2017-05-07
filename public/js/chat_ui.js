/* global $,window,io*/
/* eslint arrow-parens: ["error", "as-needed"]*/
const divEscapedContentElement = message => $('<div></div>').text(message);
const divSystemContentElement = message => $('<div></div>').html(`<i>${message}</i>`);

const processUserInput = chatApp => {
  const message = $('#send-message').val();
  let systemMessage;
  const $messages = $('#messages');
  if (message.charAt(0) === '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $messages.append(divSystemContentElement(systemMessage));
    }
  } else {
    chatApp.sendMessage($('room').text(), message);
    $messages.append(divEscapedContentElement(message));
    $messages.scrollTop($messages.prop('scrollHeight'));
  }
  $('#send-message').val('');
};

const init = (chatApp, socket) => {
  socket.on('nameResult', result => {
    let message;
    if (result.success) {
      message = `You are now known as ${result.name}`;
    } else {
      message = result.message;
    }
    $('#messages').append(divSystemContentElement(message));
  });
  socket.on('joinResult', result => {
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room Changed'));
  });
  socket.on('message', message => {
    $('#messages').append(divEscapedContentElement(message.text));
  });
  socket.on('rooms', rooms => {
    const $roomList = $('#room-list');
    $roomList.empty();
    Object.keys(rooms).forEach(room => {
      let $room = rooms[room];
      $room = $room.substring(1, rooms[room].length);
      if ($room !== '') {
        $roomList.append(divEscapedContentElement($room));
      }
    });
    $('#room-list div').click(() => {
      chatApp.processCommand(`/join ${$(this).text()}`);
      $('#send-message').focus();
    });
  });
  window.setInterval(() => {
    socket.emit('rooms');
  }, 1000);
  $('#send-message').focus();

  $('#send-form').submit(() => {
    processUserInput(chatApp);
    return false;
  });
};
$('documnet').ready(() => {
  const socket = io.connect();
  const chatApp = new window.Chat(socket);

  init(chatApp, socket);
});
