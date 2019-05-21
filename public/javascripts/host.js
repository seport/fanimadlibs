const socket = window.io();

const flyby = (message) => {
  const element = document.createElement('div');
  element.className = 'comment';
  element.innerHTML = message;

  const z = Math.random();
  const y = Math.random();

  const txa = 'calc( 120vw - 0%)';
  const txb = `calc(-120vw - ${100 + Math.round(z * 50)}%)`;
  const ty = `calc(${Math.round(y * 100) - 50}vh - ${Math.round(y * 100)}% + ${Math.round((y - 0.5) * (z * 80))}vh)`;
  const tz = `-${Math.round(z * 30)}px`;

  const zi = 100 - Math.round(z * 30);

  element.style = `transform: perspective(30px) translate3d(${txa}, ${ty}, ${tz}); z-index: ${zi}`;

  document.body.append(element);

  setTimeout(() => {
    element.style = `transform: perspective(30px) translate3d(${txb}, ${ty}, ${tz}); z-index: ${zi}`;
  }, 100);

  setTimeout(() => {
    element.remove();
  }, 10000);
};

socket.on('comment', (message) => {
  flyby(message);
});
