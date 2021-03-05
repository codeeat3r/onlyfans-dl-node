const axios = require("axios");
const https = require("https");
const fs = require("fs");

/**
 * check api response
 * @param {HTTPResponse} response - http response from api request
 */
const checkApiResponse = response => {
  const { statusText, status, data } = response;
  if (statusText !== "OK") {
    throw new Error(`Network response was not ok. Got an Error ${status}`);
  }

  return data;
};

/**
 * handle api error
 * @param {Object} error - http error object
 */
const errorHandler = error => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log("error.response.data: ", error.response.data);
    console.log("error.response.status: ", error.response.status);
    console.log("error.response.headers: ", error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log("error.request: ", error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error: ", error.message);
  }
};

/**
 *
 * @param {Object} param0 - post request object
 * @param {string} param0.url - post request url
 * @param {Object} param0.data - post request body
 * @param {Object} param0.headers - post request headers
 */
const postApi = ({ url = "", data = {}, headers = {} }) => {
  return axios({
    url,
    method: "POST",
    headers,
    data: JSON.stringify(data)
  })
    .then(checkApiResponse)
    .catch(errorHandler);
};

/**
 *
 * @param {Object} param0 - get request object
 * @param {string} param0.url - get request url
 * @param {Object} param0.params - get request params
 * @param {Object} param0.headers - get request headers
 */
const getApi = ({ url = "", params = {}, headers = {} }) => {
  return axios({
    url,
    params,
    method: "GET",
    headers
  })
    .then(checkApiResponse)
    .catch(errorHandler);
};

const getFile = (url, filePath) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, response => {
        const { statusCode, headers } = response;
        let retry = 0;
        const data = [];

        if (statusCode == 200) {
          response
            .on("data", chunk => data.push(chunk))
            .on("end", () => resolve({ data: Buffer.concat(data), filePath }));
        } else {
          retry += 1;
          if (retry > 3) {
            reject(`Server responded with status code: ${statusCode}. Retry limit exceeded`);
          }
          console.error(`Server responded with status code: ${statusCode}, retrying...`);
          getFile(headers.location, filePath);
        }
      })
      .on("error", err => reject(`https fetch ${err}`));
  });
};

module.exports = { getApi, postApi, getFile };
