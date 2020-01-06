///<reference path="../types/types.d.ts" />
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import { log } from './log';

const INFO_FILE = path.join(__dirname, '../comics');
const BLOCKED_WORDS_CSV = process.env.BLOCKED_WORDS || null;
const BLOCKED_WORDS = BLOCKED_WORDS_CSV ? BLOCKED_WORDS_CSV.split(',').map(word => word.trim()) : [];
// These are comics which do not have a decent static image
const INTERACTIVE = [1110, 1190, 1193, 1446, 1525, 1608, 1663];
const DO_NOT_EXIST = [404];

type Comic = {
  num: number;
  url: string;
  title: string;
  img: string;
  alt: string;
  year: string;
  month: string;
  day: string;
  transcript: string;
}

// These are updated after setup() is called
let ignoreList: number[] = [];
let latest = 0;
let comicData: { [key: string]: Comic } = {};

function sortNumber(a: number, b: number) {
  return a - b;
}

function setup(callback: (err: Error) => void) {
  updateInfo(function (err) {
    if (err) return callback(err);
    readAllComicFiles(INFO_FILE, function (err: Error, data: { [key: string]: Comic }) {
      if (err) return callback(err);
      const latestComicNumber = Object.keys(data).map(num_s => parseInt(num_s)).sort(sortNumber).reverse()[0];
      latest = latestComicNumber;
      comicData = data;
      const nsfwComics = Object.keys(data)
        .filter(key => {
          const comic = data[key];
          let bad = false;
          BLOCKED_WORDS.forEach(word => {
            if (comic.transcript.toLowerCase().indexOf(word.toLowerCase()) != -1) bad = true;
            if (comic.alt.toLowerCase().indexOf(word.toLowerCase()) != -1) bad = true;
          });
          return bad;
        })
        .map(key => parseInt(key));
      log(`${nsfwComics.length} comics have naughty words`);
      ignoreList = INTERACTIVE.concat(DO_NOT_EXIST).concat(nsfwComics);
      log('setup() complete');
      callback(null);
    });
  });
}

function getLatestDownloadedComicNumber(downloadedComics: string[]) {
  if (downloadedComics.length > 0) {
    return downloadedComics.map(f => parseInt(f.split('.')[0])).sort(sortNumber).reverse()[0];
  }
  return null;
}

function readAllComicFiles(comicFolder: string, callback: (err: Error, data: { [key: string]: Comic }) => void) {
  const files = fs.readdirSync(comicFolder);
  const data: { [key: string]: Comic } = {};

  try {
    files.forEach(fileName => {
      const comicNumberString = fileName.split('.')[0];
      const fileText = fs.readFileSync(`${comicFolder}/${fileName}`, 'utf-8');
      data[comicNumberString] = JSON.parse(fileText);
    });
  } catch (e) {
    return callback(e, null);
  }

  callback(null, data);
}

function updateInfo(callback: (err: Error) => void) {
  // Get latest comic number
  getLatestComicNumber(function (latestComicNumber) {
    // Get latest comic from info yaml file
    if (!fs.existsSync(INFO_FILE)) {
      fs.mkdirSync(INFO_FILE);
    }
    const downloadedComics = fs.readdirSync(INFO_FILE);
    const latestDownloaded = getLatestDownloadedComicNumber(downloadedComics) || 0;
    if (latestComicNumber > latestDownloaded) {
      // Fetch metadata and transcript for each outstanding comic in turn
      fetchComics(latestDownloaded + 1, latestComicNumber, function () {
        callback(null);
      });
    } else {
      callback(null);
    }
  })
}

function fetchComics(nextToDownload: number, maxComicNumber: number, callback: () => void) {
  if (nextToDownload > maxComicNumber) {
    log('completed!');
    return callback();
  }

  log(`Getting #${nextToDownload}`);
  request(`https://www.explainxkcd.com/wiki/index.php/${nextToDownload}`, function (explainError, explainResponse, explainBody) {
    request(`https://xkcd.com/${nextToDownload}/info.0.json`, function (apiError, apiResponse, apiBody) {
      if (explainError || apiError || explainResponse.statusCode != 200 || apiResponse.statusCode != 200) {
        log(`Error getting data for #${nextToDownload}; continuing with next one.\nexplainError:${explainError}\napiError:${apiError}\nexplainResponse:${explainResponse.statusCode}\napiResponse:${apiResponse.statusCode}`);
      } else {
        const $ = cheerio.load(explainBody);
        const apiData = JSON.parse(apiBody);
        const data: Comic = {
          num: nextToDownload,
          url: `https://xkcd.com/${nextToDownload}`,
          title: apiData.title,
          img: apiData.img,
          alt: $('.image').attr('title') || '',
          year: apiData.year,
          month: apiData.month,
          day: apiData.day,
          transcript: ''
        };
        try {
          data.transcript = $('#Transcript').parent().nextUntil(':header').filter('dl').text();
        } catch (e) {
          log(`Transcript for ${nextToDownload} failed: ${e}`);
        }
        fs.writeFileSync(`${INFO_FILE}/${nextToDownload}.json`, JSON.stringify(data, null, 2));
      }
      fetchComics(++nextToDownload, maxComicNumber, callback);
    });
  });
}

function getLatestComicNumber(callback: (number: number) => void) {
  log('fetching latest');
  request('https://xkcd.com/info.0.json', function (error, response, body) {
    try {
      const max: number = JSON.parse(body).num;
      latest = max;
      if (callback) callback(max);
    } catch (e) {
      log('failed to get latest comic:', e);
    }
  });
}

setInterval(setup, 86400000); // Update once a day

/**
 * Returns a comic number that is compatible with this site (i.e. non-interactive and safe for work)
 */
function randomComicNumber(): number {
  const num = Math.ceil(Math.random() * latest);
  if (ignoreList.includes(num)) {
    return randomComicNumber();
  } else {
    return num;
  }
}

/**
 * Uses the xkcd API to get metadata for a specific comic
 * @param {number} comicNumber Leave null for latest
 */
function getComic(comicNumber?: number) {
  if (!comicNumber) comicNumber = latest;
  log(`Returning comic #${comicNumber}`);
  return comicData[comicNumber];
}

function findComics(query: string) {
  return Object.keys(comicData)
    .filter(key => comicData[key].title.toLowerCase().includes(query.toLowerCase()) || comicData[key].transcript.toLowerCase().includes(query.toLowerCase()) || comicData[key].alt.toLowerCase().includes(query.toLowerCase()))
    .map(key => comicData[key]);
}

export { setup, getComic, randomComicNumber, findComics };
