const app = require('express')();
const http = require('http');
const cheerio = require('cheerio');

app.get('/', function (req, res) {
  xkcdImage('', function (url) {
    res.send(buildResponse(url));
  });
});

app.get('/random', function (req, res) {
  res.send("I have no idea what I'm doing");
});

app.get('/:comic(\\d+)', function (req, res) {
  xkcdImage(req.params.comic + '/', function (url) {
    res.send(buildResponse(url));
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


function xkcdImage(comic, callback) {
  var options = {
    hostname: "xkcd.com",
    path: `/${comic}`,
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
      let $ = cheerio.load(data)
      var comicUrl = $('#comic img').first().attr('src')//.html()//.attr('src');
      console.log(comicUrl);
      callback(comicUrl);
    });
  }).on('error', function (e) {
    console.log({ message: e.message });
    callback("some error happened :(")
  });
  // callback(`I might have got the comic`);
}

// parser.parse('<p>I am a very small HTML document</p>');

// console.log(document.getElementsByTagName("p")[0].innerHTML);

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
