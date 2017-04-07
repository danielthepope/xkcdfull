var app = require('express')();
var extend = require('extend');
var https = require('https');
var cheerio = require('cheerio');
var exphbs = require('express-handlebars');
var NodeCache = require('node-cache');
var cache = new NodeCache({stdTTL: 60, checkperiod: 100});
var port = process.env.PORT || 3000;

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
  if (!renderFromCache('random', res, 'index')) {
    randomImageNumber(function (number) {
      renderXkcdImageAndCache(res, number, 'index', 'random');
    });
  }
});

app.get('/latest', function (req, res) {
  renderFromCache('latest', res, 'index') || renderXkcdImageAndCache(res, '', 'index', 'latest');
});

app.get('/rotate', function (req, res) {
  if (!renderFromCache('random', res, 'index', {rotate:true})) {
    randomImageNumber(function (number) {
      renderXkcdImageAndCache(res, number, 'index', 'random', {rotate:true});
    });
  }
});

app.get('/imageonly', function (req, res) {
  if (!renderFromCache('random', res, 'imageonly')) {
    randomImageNumber(function (number) {
      renderXkcdImageAndCache(res, number, 'imageonly', 'random');
    });
  }
});

app.get('/:comic(\\d+)', function (req, res) {
  var number = req.params.comic;
  renderFromCache(number, res, 'index') || renderXkcdImageAndCache(res, number, 'index');
});

app.listen(port, function () {
  log('xkcd-full running on port ' + port);
});

function renderFromCache(key, res, page, options) {
  var cached = cache.get(key);
  if (cached) {
    log('returning cached ' + cached.imageUrl);
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
        imageUrl: $('#comic img').first().attr('src'),
        altText: $('#comic img').first().attr('title'),
        xkcdUrl: 'https://xkcd.com/' + comic + '/',
        comicNumber: comic,
        comicName: $('#ctitle').text()
      }
      log(output.imageUrl);
      callback(null, output);
    });
  }).on('error', function (e) {
    log({ message: e.message });
    callback('some error happened :(');
  });
}

function log(message) {
  console.log(new Date().toISOString() + " " + message);
}

/* bad ones
1608
*/
