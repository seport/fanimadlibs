const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const db = require('./config');

const upload = multer();

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const categories = [
  { id: 1, name: 'Current Season' },
  { id: 2, name: 'Oldies/Nostalgia' },
  { id: 3, name: "Boy's Love" },
  { id: 4, name: 'Fanservice/Moe' },
  { id: 5, name: 'Shoujo/Romance' },
  { id: 6, name: 'Shounen/Action' },
  { id: 7, name: 'Dank Memes' },
];

const madlibsByCategory = categories.map(c => ({ ...c, madlibs: [] }));

const categorizeMadlib = (acc, madlib) => {
  acc
    .find(c => c.id === madlib.category).madlibs
    .push(madlib);
  return acc;
};

app.get('/', (_req, res) => {
  db.query('SELECT * FROM madlibs', (err, results) => {
    if (err) {
      return res.render('error');
    }
    const madlibs = results.rows.reduce(categorizeMadlib, madlibsByCategory);
    return res.render('index', { madlibs });
  });
});

app.get('/madlibs/new', (_req, res) => {
  res.render('new', { categories });
});

app.get('/madlibs/:id', (req, res) => {
  db.query('SELECT * FROM madlibs WHERE id = $1', [req.params.id], (err, result) => {
    if (err) {
      return res.render('error');
    }
    const madlib = result.rows[0];
    madlib.madlib = madlib.madlib.replace(/\n/g, '</p><p>');
    madlib.madlib = madlib.madlib.replace(/\[/g, "<input placeholder='");
    madlib.madlib = madlib.madlib.replace(/\]/g, "'/>");
    return res.render('show', { madlib });
  });
});

app.get('/madlibs/:id/edit', (req, res) => {
  db.query('SELECT * FROM madlibs WHERE id = $1', [req.params.id], (err, result) => {
    if (err) {
      return res.render('error');
    }
    return res.render('edit', { madlib: result.rows[0], categories });
  });
});

app.post('/madlibs/:id/update', (req, res) => {
  db.query(
    'UPDATE madlibs SET title = $1, category = $2, madlib = $3 WHERE id = $4',
    [req.body.title, req.body.category, req.body.madlib, req.params.id],
    (err, _result) => {
      if (err) {
        return res.render('error');
      }
      return res.redirect(`/madlibs/${req.params.id}`);
    },
  );
});

app.post('/madlibs', upload.array(), (req, res) => {
  db.query('INSERT INTO madlibs (title, category, madlib) VALUES ($1, $2, $3) RETURNING *', [req.body.title, req.body.category, req.body.madlib], (err, result) => {
    if (err) {
      return res.render('error');
    }
    return res.redirect(`/madlibs/${result.rows[0].id}`);
  });
});


module.exports = app;
