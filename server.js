const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const io = require('socket.io');
const basicAuth = require('express-basic-auth');
const wordsPath = require('word-list');

const auth = basicAuth({
  challenge: true,
  users: {
    admin: process.env.PASSWORD,
  },
});

const db = require('./config');

const upload = multer();

const app = express();
const server = http.Server(app);
const sockets = io(server);

const profanities = ['word'];
const words = fs.readFileSync(wordsPath);

const regex = profanities.map(word => `\\b[^ ]*${
  word
    .split('')
    .map(letter => letter
      .replace(/a/g, '[a@4]')
      .replace(/b/g, '[b68]')
      .replace(/e/g, '[e3]')
      .replace(/g/g, '[g6]')
      .replace(/i/g, '[il1/\\|]')
      .replace(/l/g, '[li1/\\|]')
      .replace(/o/g, '[o0]')
      .replace(/s/g, '[s5]')
      .replace(/t/g, '[t7]'))
    .join('[^a-n,^p-w,^y-z]*')
}[^ ]*\\b`).join('|');

const profanity = new RegExp(regex, 'gi');

sockets.on('connection', (socket) => {
  socket.on('comment', (data) => {
    const message = data.replace(profanity, (match) => {
      const word = match.toLowerCase();
      if (profanities.indexOf(word) >= 0 || words.indexOf(word) < 0) {
        return 'nya';
      }
      return match;
    });

    socket.emit('ok', true);
    sockets.emit('comment', message);
  });
});

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const categories = [
  { id: null, name: 'Uncategorized' },
  { id: 1, name: 'Current Season' },
  { id: 2, name: 'Oldies/Nostalgia' },
  { id: 3, name: "Boy's Love" },
  { id: 4, name: 'Fanservice/Moe' },
  { id: 5, name: 'Shoujo/Romance' },
  { id: 6, name: 'Shounen/Action' },
  { id: 7, name: 'Dank Memes' },
];

app.get('/admin', auth, (_req, res) => {
  const categorizeMadlib = (acc, madlib) => {
    acc
      .find(c => c.id === madlib.category).madlibs
      .push(madlib);
    return acc;
  };

  const madlibsByCategory = categories.map(c => ({ ...c, madlibs: [] }));

  db.query('SELECT * FROM madlibs', (err, results) => {
    if (err) {
      return res.render('error');
    }
    const madlibs = results.rows.reduce(categorizeMadlib, madlibsByCategory);
    return res.render('admin', { madlibs });
  });
});

app.get('/admin/madlibs/new', auth, (_req, res) => {
  res.render('new', { categories });
});

app.get('/admin/madlibs/:id', auth, (req, res) => {
  db.query('SELECT * FROM madlibs WHERE id = $1', [req.params.id], (err, result) => {
    if (err) {
      return res.render('error');
    }
    const madlib = result.rows[0];
    return res.render('show', { madlib, categories });
  });
});

app.get('/admin/madlibs/:id/edit', auth, (req, res) => {
  db.query('SELECT * FROM madlibs WHERE id = $1', [req.params.id], (err, result) => {
    if (err) {
      return res.render('error');
    }
    return res.render('edit', { madlib: result.rows[0], categories });
  });
});

app.post('/admin/madlibs/:id/update', auth, (req, res) => {
  db.query(
    'UPDATE madlibs SET title = $1, category = $2, madlib = $3 WHERE id = $4',
    [req.body.title, req.body.category, req.body.madlib, req.params.id],
    (err, _result) => {
      if (err) {
        return res.render('error');
      }
      return res.redirect(`/admin/madlibs/${req.params.id}`);
    },
  );
});

app.post('/admin/madlibs', auth, upload.array(), (req, res) => {
  db.query('INSERT INTO madlibs (title, category, madlib) VALUES ($1, $2, $3) RETURNING *', [req.body.title, req.body.category, req.body.madlib], (err, result) => {
    if (err) {
      return res.render('error');
    }
    return res.redirect(`/admin/madlibs/${result.rows[0].id}`);
  });
});

app.get('/', (_req, res) => {
  res.render('index');
});

app.get('/play', auth, (_req, res) => {
  db.query('SELECT * FROM madlibs', (err, results) => {
    if (err) {
      return res.render('error');
    }
    const madlibs = results.rows;
    return res.render('play', { madlibs, categories });
  });
});

module.exports = server;
