if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var db = require('./config');
var upload = multer();

var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/', function(req,res) {
  db.query('SELECT * FROM madlibs', (err, results) => {
    if (err) {
      throw err
    }
    console.log(results.rows)
    res.render('index', {madlibs:results.rows});
  })
})

app.get('/madlib/:id', function(req,res) {
  db.query('SELECT * FROM madlibs WHERE id = $1', [req.params.id], (err,result) => {
    if (err) {
      throw err
    }
    madlib = result.rows[0]
    madlib.madlib = madlib.madlib.replace(/\n/g,"</p><p>")
    madlib.madlib = madlib.madlib.replace(/\[/g,"<input placeholder='")
    madlib.madlib = madlib.madlib.replace(/\]/g,"'/>")
    res.render('show', {madlib:madlib})
  })
})

app.get('/new', function(req,res) {
  res.sendfile('public/form.html');
});

app.get('/edit/:id', function(req,res) {
  db.query('SELECT * FROM madlibs WHERE id = $1', [req.params.id], (err,result) => {
    if (err) {
      throw err
    }
    res.render('edit', {madlib:result.rows[0]})
  })
})

app.post('/update/:id', function(req,res) {
  db.query(
    'UPDATE madlibs SET title = $1, category = $2, madlib = $3 WHERE id = $4',
    [req.body.title, req.body.category, req.body.madlib, req.params.id],
    (err, result) => {
      if (err) {
        throw err
      }
      res.redirect(`/madlib/${req.params.id}`)
    }
  )
})

app.get('/preview', function(req,res) {
  res.sendfile('public/preview.html');
})

app.post('/create', upload.array(), function(req,res) {
  db.query('INSERT INTO madlibs (title, category, madlib) VALUES ($1, $2, $3) RETURNING *', [req.body.title, req.body.category, req.body.madlib], (err, result) => {
    if (err) {
      throw err
    }
    res.redirect(`/madlib/${result.rows[0].id}`)
  })
})


module.exports = app;
