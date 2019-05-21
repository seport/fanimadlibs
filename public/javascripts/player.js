const socket = window.io();

window.comment = () => {
  const input = document.getElementById('comment-message');
  const button = document.getElementById('comment-button');

  if (input.value === '') return;

  input.disabled = true;
  button.disabled = true;

  socket.emit('comment', input.value);

  socket.once('ok', (ok) => {
    input.disabled = false;
    button.disabled = false;

    if (ok) {
      input.value = '';
      input.className = '';
    } else {
      input.className = 'error';
    }
  });
};
