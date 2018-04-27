const express = require('express');
const app = express();
const extend = require('extend');
const exphbs = require('express-handlebars');
const port = process.env.PORT || 3000;

const log = require('./log.js');
const xkcdApi = require('./xkcdapi.js');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
  let page = 'index';
  let rotate = false;
  if(req.query.full !== undefined) page = 'imageonly';
  if(req.query.rotate !== undefined) rotate = parseInt(req.query.rotate) || 60;
  renderComic(res, xkcdApi.randomComicNumber(), page, {rotate: rotate});
});

app.get('/test', function (req, res) {
  res.render('testlayout');
});

app.get('/latest', function (req, res) {
  let page = 'index';
  if(req.query.full !== undefined) page = 'imageonly';
  renderComic(res, null, page);
});

app.get('/:comic(\\d+)', function (req, res) {
  let page = 'index';
  if(req.query.full !== undefined) page = 'imageonly';
  const number = req.params.comic;
  renderComic(res, number, page);
});

app.get('/search/:query', function (req, res) {
  const query = req.params.query;
  const page = 'search';
  const results = xkcdApi.findComics(query);
  res.render(page, {results, query});
});

app.use(express.static('public', {maxAge: 86400000}));

xkcdApi.setup(function(err) {
  if (err) return log(err);
  app.listen(port, function () {
    log(`xkcd-full running on port ${port}`);
  });
});

function renderComic(res, number, page, options) {
  const metadata = xkcdApi.getComic(number);
  if (metadata) {
    res.set('Cache-Control', 'public, max-age=3');
    res.render(page, extend(options, metadata));
  } else {
    log(`No data available for that comic`);
    return res.send('some error happened.');
  }
}
