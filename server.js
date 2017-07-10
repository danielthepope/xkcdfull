var express = require('express');
var app = express();
var extend = require('extend');
var exphbs = require('express-handlebars');
var NodeCache = require('node-cache');
var cache = new NodeCache({stdTTL: 60, checkperiod: 100});
var port = process.env.PORT || 3000;

var log = require('./log.js');
var xkcdApi = require('./xkcdapi.js');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
  var page = 'index';
  var rotate = false;
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
  var page = 'index';
  if(req.query.full !== undefined) page = 'imageonly';
  renderFromCache('latest', res, page) || renderXkcdImageAndCache(res, '', page, 'latest');
});

app.get('/:comic(\\d+)', function (req, res) {
  var page = 'index';
  if(req.query.full !== undefined) page = 'imageonly';
  var number = req.params.comic;
  renderFromCache(number, res, page) || renderXkcdImageAndCache(res, number, page);
});

app.listen(port, function () {
  log('xkcd-full running on port ' + port);
});
app.use(express.static('public'));

function renderFromCache(key, res, page, options) {
  var cached = cache.get(key);
  if (cached) {
    log('returning cached ' + cached.img);
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
