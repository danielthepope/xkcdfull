const app = require('express')();
const http = require('http');
const cheerio = require('cheerio');
const exphbs = require('express-handlebars');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
  randomImage(function (url) {
    const number = url.match(/\d+/)[0];
    xkcdImage(number, function(err, data) {
      if (err) return res.send("some error happened.");
      res.render('index', data);
    });
  });
});

app.get('/latest', function (req, res) {
  xkcdImage('', function (err, data) {
    if (err) return res.send("some error happened.");
    res.render('index', data);
  });
});

app.get('/rotate', function (req, res) {
  randomImage(function (url) {
    const number = url.match(/\d+/)[0];
    xkcdImage(number, function(err, data) {
      if (err) return res.send("some error happened.");
      data.rotate = true;
      res.render('index', data);
    });
  });
});

app.get('/:comic(\\d+)', function (req, res) {
  xkcdImage(req.params.comic, function (err, data) {
    if (err) return res.send("some error happened.");
    res.render('index', data);
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

function randomImage(callback) {
  const options = {
    hostname: "c.xkcd.com",
    path: `/random/comic/`,
    port: 80
  };
  http.get(options, function (result) {
    const location = result.headers.location;
    console.log(`Location ${location}`);
    callback(location);
  })
}


function xkcdImage(comic, callback) {
  const options = {
    hostname: "xkcd.com",
    path: `/${comic}/`,
    port: 80
  };
  http.get(options, function (result) {
    var data = "";
    result.on("data", function (chunk) {
      data += chunk;
    });
    result.on("end", function (chunk) {
      let $ = cheerio.load(data);
      var output = {
        imageUrl: $('#comic img').first().attr('src'),
        altText: $('#comic img').first().attr('title'),
        xkcdUrl: `http://xkcd.com/${comic}/`,
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
