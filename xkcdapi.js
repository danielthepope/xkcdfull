const request = require('request');
const log = require('./log');

// These are comics which do not have a decent static image
const interactive = [1110,1190,1193,1446,1525,1608,1663];
const nsfw = [75]; // TODO find comics with language that may be considered inappropriate for the workplace.
const doNotExist = [404];

const ignore = interactive.concat(nsfw).concat(doNotExist);

let latest = 1860;

function fetchLatest() {
  log('fetching latest');
  request('https://xkcd.com/info.0.json', function(error, response, body) {
    try {
      const max = JSON.parse(body).num;
      latest = max;
    } catch (e) {
      log('failed to get latest comic:', e);
    }
  });
}

setInterval(fetchLatest, 86400000); // Update once a day
fetchLatest();

/**
 * Returns a comic number that is compatible with this site (i.e. non-interactive and safe for work)
 */
function randomComicNumber() {
  const num = Math.ceil(Math.random() * latest);
  if (ignore.indexOf(num) == -1) return num;
  else return randomComicNumber();
}

/**
 * Uses the xkcd API to get metadata for a specific comic
 * @param {Number} comicNumber 
 * @param {Function} callback function(error, data), where data is an object.
 */
function getComic(comicNumber, callback) {
  const url = `https://xkcd.com/${comicNumber}/info.0.json`;
  log(`Calling ${url}`);
  request(url, function(error, response, body) {
    if (error) return callback(error);
    try {
      return callback(null, JSON.parse(body));
    } catch (e) {
      return callback(e);
    }
  });
}

module.exports = {getComic, randomComicNumber};

