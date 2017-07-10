var express = require('express');
var app = express();
var extend = require('extend');
var https = require('https');
var cheerio = require('cheerio');
var exphbs = require('express-handlebars');
var NodeCache = require('node-cache');
var cache = new NodeCache({stdTTL: 60, checkperiod: 100});
var port = process.env.PORT || 3000;

var log = require('./log');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
  var page = 'index';
  var rotate = false;
  if(req.query.full !== undefined) page = 'imageonly';
  if(req.query.rotate !== undefined) rotate = true;
  if (!renderFromCache('random', res, page, {rotate: rotate})) {
    randomImageNumber(function (number) {
      renderXkcdImageAndCache(res, number, page, 'random', {rotate: rotate});
    });
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
  xkcdImage(number, function(err, data) {
    if (err) return res.send('some error happened.');
    res.render(page, extend(options, data));
    if (number) cache.set(number, data, 3600);
    if (cacheKeys && cacheKeys.indexOf('latest') > -1) cache.set('latest', data, 600);
    if (cacheKeys && cacheKeys.indexOf('random') > -1) cache.set('random', data, 10);
  });
}

function randomImageNumber(callback) {
  var options = {
    hostname: 'c.xkcd.com',
    path: '/random/comic/',
    port: 443
  };
  https.get(options, function (result) {
    var location = result.headers.location;
    log('Location ' + location);
    if (!location) callback('221');
    else callback(location.match(/\d+/)[0]);
  }).on('error', function (e) {
    log({ message: e.message, });
    callback('221');
  })
}

function xkcdImage(comic, callback) {
  var options = {
    hostname: 'xkcd.com',
    path: '/' + comic + '/',
    port: 443
  };
  https.get(options, function (result) {
    var data = '';
    result.on('data', function (chunk) {
      data += chunk;
    });
    result.on('end', function (chunk) {
      var $ = cheerio.load(data);
      var output = {
        img: $('#comic img').first().attr('src'),
        alt: $('#comic img').first().attr('title'),
        xkcdUrl: 'https://xkcd.com/' + comic + '/',
        num: comic,
        title: $('#ctitle').text()
      }
      log(output.img);
      callback(null, output);
    });
  }).on('error', function (e) {
    log({ message: e.message });
    callback('some error happened :(');
  });
}
