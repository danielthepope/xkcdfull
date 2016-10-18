var app = require('express')();
var extend = require('extend');
var http = require('http');
var cheerio = require('cheerio');
var exphbs = require('express-handlebars');
var NodeCache = require('node-cache');
var cache = new NodeCache({stdTTL: 60, checkperiod: 100});
var port = process.env.PORT || 3000;

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
  var cached = cache.get('random');
  if (cached) {
    console.log('returning cached ' + cached.imageUrl);
    return res.render('index', cached);
  }
  randomImage(function (url) {
    var number = url.match(/\d+/)[0];
    xkcdImage(number, function(err, data) {
      if (err) return res.send("some error happened.");
      cache.set('random', data, 10);
      cache.set(number, data, 3600);
      res.render('index', data);
    });
  });
});

app.get('/latest', function (req, res) {
  var cached = cache.get('latest');
  if (cached) {
    console.log('returning cached ' + cached.imageUrl);
    return res.render('index', cached);
  }
  xkcdImage('', function (err, data) {
    if (err) return res.send("some error happened.");
    cache.set('latest', data, 600);
    res.render('index', data);
  });
});

app.get('/rotate', function (req, res) {
  var cached = cache.get('random');
  if (cached) {
    console.log('returning cached ' + cached.imageUrl);
    return res.render('index', extend({rotate:true}, cached));
  }
  randomImage(function (url) {
    var number = url.match(/\d+/)[0];
    xkcdImage(number, function(err, data) {
      if (err) return res.send("some error happened.");
      cache.set('random', data, 10);
      data.rotate = true;
      res.render('index', data);
    });
  });
});

app.get('/imageonly', function (req, res) {
  var cached = cache.get('random');
  if (cached) {
    console.log('returning cached ' + cached.imageUrl);
    return res.render('imageonly', cached);
  }
  randomImage(function (url) {
    var number = url.match(/\d+/)[0];
    xkcdImage(number, function(err, data) {
      if (err) return res.send("some error happened.");
      cache.set('random', data, 10);
      cache.set(number, data, 3600);
      res.render('imageonly', data);
    });
  });
});

app.get('/:comic(\\d+)', function (req, res) {
  var number = req.params.comic;
  var cached = cache.get(number);
  if (cached) {
    console.log('returning cached ' + cached.imageUrl);
    return res.render('index', cached);
  }
  xkcdImage(number, function (err, data) {
    if (err) return res.send("some error happened.");
    cache.set(number, data, 3600);
    res.render('index', data);
  });
});

app.listen(port, function () {
  console.log('xkcd-full running on port ' + port);
});

function randomImage(callback) {
  var options = {
    hostname: "c.xkcd.com",
    path: '/random/comic/',
    port: 80
  };
  http.get(options, function (result) {
    var location = result.headers.location;
    console.log('Location ' + location);
    callback(location);
  })
}


function xkcdImage(comic, callback) {
  var options = {
    hostname: "xkcd.com",
    path: '/' + comic + '/',
    port: 80
  };
  http.get(options, function (result) {
    var data = "";
    result.on("data", function (chunk) {
      data += chunk;
    });
    result.on("end", function (chunk) {
      var $ = cheerio.load(data);
      var output = {
        imageUrl: $('#comic img').first().attr('src'),
        altText: $('#comic img').first().attr('title'),
        xkcdUrl: 'http://xkcd.com/' + comic + '/',
        comicNumber: comic,
        comicName: $('#ctitle').text()
      }
      console.log(output.imageUrl);
      callback(null, output);
    });
  }).on('error', function (e) {
    console.log({ message: e.message });
    callback("some error happened :(");
  });
}

/* bad ones
1608
*/
