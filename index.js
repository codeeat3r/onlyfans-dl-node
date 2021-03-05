"use strict";
const processFile = require("./process_file");

if (process.argv.length != 4) {
  console.log("Usage: npm start <profile> <accessToken>");
  return;
}

const profile = process.argv[2];
const accessToken = process.argv[3];
const getProfile = new processFile(profile, accessToken);

if (getProfile) {
  getProfile.init();
}
