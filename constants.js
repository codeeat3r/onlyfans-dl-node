const BASE_URL = "https://onlyfans.com/api2/v2";
const APP_TOKEN = "33d57ade8c02dbc5a333db99ff9ae26a";
const API_HEADER = {
  Accept: "application/json, text/plain, */*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36",
  "Accept-Encoding": "gzip, deflate"
};
const DIR = "./profiles";
// in case of fetch errors, tweak limit values here
const API_LIMIT = 10;
const MEDIA_TYPES = [{ type: "videos", limit: 100 }]; // videos, photos, archived

module.exports = { BASE_URL, APP_TOKEN, API_HEADER, DIR, API_LIMIT, MEDIA_TYPES };
