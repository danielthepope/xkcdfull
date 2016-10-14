const app = require('express')();
const http = require('http');
const cheerio = require('cheerio');

app.get('/', function (req, res) {
  randomImage(function (url) {
    var number = url.match(/\d+/)[0];
    xkcdImage(number, function(imageUrl) {
      res.send(buildResponse(imageUrl));
    });
  });
});

app.get('/latest', function (req, res) {
  xkcdImage('', function (imageUrl) {
    res.send(buildResponse(imageUrl));
  });
});

app.get('/:comic(\\d+)', function (req, res) {
  xkcdImage(req.params.comic, function (imageUrl) {
    res.send(buildResponse(imageUrl));
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

function randomImage(callback) {
  var options = {
    hostname: "c.xkcd.com",
    path: `/random/comic/`,
    port: 80
  };
  http.get(options, function (result) {
    var location = result.headers.location;
    console.log(`Location ${location}`);
    callback(location);
  })
}


function xkcdImage(comic, callback) {
  var options = {
    hostname: "xkcd.com",
    path: `/${comic}/`,
    port: 80
  };
  http.get(options, function (result) {
    var data = "";
    result.on("data", function (chunk) {
      data += chunk;
    });
    var tags = [];
    var tagsCount = {};
    var tagsWithCount = [];
    result.on("end", function (chunk) {
      let $ = cheerio.load(data);
      var comicUrl = $('#comic img').first().attr('src');
      console.log(comicUrl);
      callback(comicUrl);
    });
  }).on('error', function (e) {
    console.log({ message: e.message });
    callback("some error happened :(");
  });
}

function buildResponse(url) {
  return `
<!DOCTYPE html>
<html>
<head>
<style>
html, body {
  margin: 0;
  height: 100%;
}
#comic {
  background-image: url('${url}');
  background-repeat: no-repeat;
  background-position: center center;
  background-size: contain;
  width:100%;
  min-height:100%;
}
</style>
<body>
<div id="comic"></div>
</body>
</html>
`
}
