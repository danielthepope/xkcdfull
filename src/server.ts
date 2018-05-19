import * as express from 'express';
import * as extend from 'extend';
import * as exphbs from 'express-handlebars';
import { log } from './log';
import * as xkcdApi from './xkcdapi';

const app = express();
const port = process.env.PORT || 3000;

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
  const rotate = req.query.rotate !== undefined ? parseInt(req.query.rotate) || 60 : null;
  const page = req.query.full !== undefined ? 'imageonly' : 'index';
  renderComic(res, xkcdApi.randomComicNumber(), page, { rotate: rotate });
});

app.get('/test', function (req, res) {
  res.render('testlayout');
});

app.get('/latest', function (req, res) {
  let page = 'index';
  if (req.query.full !== undefined) page = 'imageonly';
  renderComic(res, null, page);
});

app.get('/:comic(\\d+)', function (req, res) {
  let page = 'index';
  if (req.query.full !== undefined) page = 'imageonly';
  const number = req.params.comic;
  renderComic(res, number, page);
});

app.get('/search/:query', function (req, res) {
  const query = req.params.query.replace('+', ' ');
  const page = 'search';
  const results = xkcdApi.findComics(query);
  res.render(page, { results, query });
});

app.use(express.static('public', { maxAge: 86400000 }));

xkcdApi.setup(function (err) {
  if (err) return log(null, err);
  app.listen(port, function () {
    log(`xkcd-full running on port ${port}`);
  });
});

function renderComic(res: express.Response, number: number, page: string, options = {}) {
  const metadata = xkcdApi.getComic(number);
  if (metadata) {
    res.set('Cache-Control', 'public, max-age=3');
    res.render(page, extend(options, metadata));
  } else {
    log(`No data available for that comic`);
    return res.send('some error happened.');
  }
}
