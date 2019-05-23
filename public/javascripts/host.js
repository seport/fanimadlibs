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

const played = JSON.parse(localStorage.getItem('played')) || [];

const getChoices = (category) => {
  const madlibs = window.madlibs.filter(madlib => madlib.category === category);
  return madlibs.filter(madlib => played.indexOf(madlib.id) === -1);
};

const choose = (from) => {
  if (from.length === 0) return null;
  return from[Math.floor(Math.random() * from.length)];
};

const update = () => {
  window.categories
    .forEach(({ id }) => {
      const element = document.querySelector(`.btn-genre-${id}`);
      if (getChoices(id).length === 0) {
        element.setAttribute('disabled', true);
      } else {
        element.removeAttribute('disabled');
      }
    });
};

window.play = (categoryId) => {
  const choices = getChoices(categoryId);
  const madlib = choose(choices);

  const playElement = document.querySelector('.play-container');
  const madlibElement = document.querySelector('.madlib-container');
  const titleElement = document.querySelector('.madlib-title');
  const contentElement = document.querySelector('.madlib-content');

  playElement.classList.add('hidden');
  madlibElement.classList.remove('hidden');
  madlibElement.classList.add('playing');
  document.body.scrollTop = 0;

  let html = madlib.madlib;

  html = `<span>${html}`;
  html = html.replace(/\n/g, '</span></p><p><span>');
  html = html.replace(/\[/g, "</span><data contenteditable placeholder='");
  html = html.replace(/\]/g, "'></data><span>");

  titleElement.innerHTML = madlib.title;
  contentElement.innerHTML = html;

  played.push(madlib.id);
  localStorage.setItem('played', JSON.stringify(played));
  update();
};

window.done = () => {
  const madlibElement = document.querySelector('.madlib-container');
  document.body.scrollTop = 0;

  madlibElement.classList.remove('playing');
};

window.back = () => {
  const playElement = document.querySelector('.play-container');
  const madlibElement = document.querySelector('.madlib-container');

  playElement.classList.remove('hidden');
  madlibElement.classList.add('hidden');
  document.body.scrollTop = 0;
};

window.reset = () => {
  played.splice(0, played.length);
  localStorage.setItem('played', '[]');

  update();
};
