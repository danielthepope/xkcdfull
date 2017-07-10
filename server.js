const express = require('express');
const app = express();
const extend = require('extend');
const exphbs = require('express-handlebars');
const NodeCache = require('node-cache');
const cache = new NodeCache({stdTTL: 60, checkperiod: 100});
const port = process.env.PORT || 3000;

const log = require('./log.js');
const xkcdApi = require('./xkcdapi.js');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
  let page = 'index';
  let rotate = false;
  if(req.query.full !== undefined) page = 'imageonly';
  if(req.query.rotate !== undefined) rotate = true;
  if (!renderFromCache('random', res, page, {rotate: rotate})) {
    renderXkcdImageAndCache(res, xkcdApi.randomComicNumber(), page, 'random', {rotate: rotate});
  }
});

app.get('/test', function (req, res) {
  res.render('testlayout');
});

app.get('/latest', function (req, res) {
  let page = 'index';
  if(req.query.full !== undefined) page = 'imageonly';
  renderFromCache('latest', res, page) || renderXkcdImageAndCache(res, '', page, 'latest');
});

app.get('/:comic(\\d+)', function (req, res) {
  let page = 'index';
  if(req.query.full !== undefined) page = 'imageonly';
  const number = req.params.comic;
  renderFromCache(number, res, page) || renderXkcdImageAndCache(res, number, page);
});

app.listen(port, function () {
  log(`xkcd-full running on port ${port}`);
});
app.use(express.static('public'));

function renderFromCache(key, res, page, options) {
  const cached = cache.get(key);
  if (cached) {
    log(`returning cached ${cached.img}`);
    res.render(page, extend(options, cached));
  }
  return !!cached;
}

function renderXkcdImageAndCache(res, number, page, cacheKeys, options) {
  xkcdApi.getComic(number, function(err, data) {
    if (err) {
      log(err);
      return res.send('some error happened.');
    }
    res.render(page, extend(options, data));
    if (number) cache.set(number, data, 3600);
    if (cacheKeys && cacheKeys.indexOf('latest') > -1) cache.set('latest', data, 600);
    if (cacheKeys && cacheKeys.indexOf('random') > -1) cache.set('random', data, 10);
  });
}
