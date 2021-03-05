const axios = require("axios");
const fs = require("fs");
const constants = require("./constants");
const api = require("./api");

class ProcessFile {
  constructor(profile, accessToken) {
    if (!profile || !accessToken) {
      return console.error("UserProfile and AccessToken are required!");
    }

    this.profile = profile;
    this.newFiles = 0;
    this.downloaded = 0;
    axios.defaults.baseURL = constants.BASE_URL;
    Object.keys(constants.API_HEADER).forEach(key => {
      axios.defaults.headers.common[key] = constants.API_HEADER[key];
    });
    axios.defaults.headers.common["app-token"] = constants.APP_TOKEN;
    axios.defaults.headers.common["access-token"] = accessToken;
  }

  async init() {
    const { MEDIA_TYPES, DIR } = constants;
    const { profile } = this;

    if (MEDIA_TYPES.length === 0) {
      console.error("No media type has been selected for download");
      process.exit();
    }

    console.log("Getting User Auth Info...");
    const loggedInUser = await this.getUserInfo("me");
    axios.defaults.headers.common["user-id"] = loggedInUser["id"];
    console.log(`Got User: ${loggedInUser["name"]}`);

    console.log("Getting Target Profile Info...");
    const targetProfile = await this.getUserInfo(profile);
    console.log(`Got Target Profile: ${targetProfile["name"]}`);

    console.log(`Downloading Content To ${DIR}/${profile}...`);
    MEDIA_TYPES.forEach(this.createDirectories.bind(this));

    console.log("Saving profile info...");
    this.saveProfileInfo(targetProfile);

    console.log("Fetching post types...");
    const fetchedPosts = MEDIA_TYPES.map(({ type, limit }) => {
      console.log(`Finding ${type}...`);
      return this.fetchPosts(`/users/${targetProfile["id"]}/posts/${type}`, limit);
    });

    Promise.allSettled(fetchedPosts).then(results => {
      let postCount = 0;
      const posts = [];

      MEDIA_TYPES.forEach(({ type }, i) => {
        const { status, value } = results[i];

        if (status === "fulfilled" && value) {
          const viewablePosts = value.filter(({ canViewMedia }) => canViewMedia);
          postCount += viewablePosts.length;

          console.log(`Found ${value.length} ${type} posts with ${viewablePosts.length} viewable`);
          posts.push({ type, data: viewablePosts });
        } else {
          console.error(`${type} fetch was not successful, status: ${status}`);
        }
      });

      if (postCount == 0) {
        console.error("No viewable post found");
        process.exit();
      }

      posts.forEach(post => {
        const isArchived = post.type == "archived";
        this.downloadPosts(post, isArchived);
      });
    });
  }

  /**
   * get information about the user
   * @param {string} profile - user's profile username
   */
  getUserInfo(profile) {
    return api.getApi({ url: `/users/${profile}` }).then(data => {
      if (data && data["error"]) {
        console.error(`Error: ${data["error"]["message"]}`);
        process.exit();
      }

      return data;
    });
  }

  /**
   * create directories
   * @param {Object} mediaType - media type object
   * @param {string} mediaType.type - type of media
   */
  createDirectories({ type }) {
    const { DIR } = constants;
    const profilePath = `${DIR}/${this.profile}`;
    const path = `${profilePath}/${type}`;

    try {
      if (!fs.existsSync(DIR)) {
        fs.mkdirSync(DIR);
      }

      if (!fs.existsSync(profilePath)) {
        fs.mkdirSync(profilePath);
      }

      if (fs.existsSync(path)) {
        console.log(`Directory ${path} exists, resuming download...`);
        return;
      } else {
        console.log(`Creating ${path} directory...`);
        fs.mkdirSync(path);
      }
    } catch (err) {
      console.error(err);
      process.exit();
    }
  }

  /**
   * save profile info in json file
   * @param {Object} profileInfo - object containing profile info
   */
  saveProfileInfo(profileInfo) {
    const { DIR } = constants;
    const { profile } = this;
    const data = {
      id: profileInfo["id"],
      name: profileInfo["name"],
      username: profileInfo["username"],
      about: profileInfo["rawAbout"],
      joinDate: profileInfo["joinDate"],
      website: profileInfo["website"],
      wishlist: profileInfo["wishlist"],
      location: profileInfo["location"],
      lastSeen: profileInfo["lastSeen"]
    };
    const json = JSON.stringify(data);

    if (!fs.existsSync(`${DIR}/${profile}/info.json`)) {
      try {
        fs.writeFileSync(`${DIR}/${profile}/info.json`, json);
        console.log(`Profile info saved`);
      } catch (err) {
        console.error(err);
        process.exit();
      }
    } else {
      console.log(`Profile info exists, resuming download...`);
    }
  }

  /**
   * fetch post data of selected media type
   * @param {string} url - api url to fetch posts
   * @param {number} limit - limit to number of posts to fetch
   */
  async fetchPosts(url, limit) {
    const { API_LIMIT } = constants;
    const params = { limit: limit < API_LIMIT ? limit : API_LIMIT };
    let posts = await api.getApi({ url, params });
    let postLength = posts.length;
    let beforePublishTime = posts[postLength - 1]["postedAtPrecise"];
    params["beforePublishTime"] = beforePublishTime;
    let newLimit = limit - postLength;

    if (newLimit > 0 && newLimit < API_LIMIT) {
      params["limit"] = newLimit;
    }

    while (newLimit > 0 && postLength == API_LIMIT) {
      const extraPosts = await api.getApi({ url, params });
      postLength = extraPosts.length;
      beforePublishTime = extraPosts[postLength - 1]["postedAtPrecise"];
      params["beforePublishTime"] = beforePublishTime;
      newLimit -= postLength;

      if (newLimit > 0 && newLimit < API_LIMIT) {
        params["limit"] = newLimit;
      }

      posts = [...posts, ...extraPosts];
    }

    return posts;
  }

  /**
   * download posts of post type
   * @param {Array} posts - list of post objects
   * @param {Boolean} isArchived - check to see if post type is archived
   */
  downloadPosts(posts, isArchived) {
    posts.data.forEach(({ media }) => media.forEach(m => this.downloadMedia(m, isArchived)));
    console.log(`Downloading ${this.newFiles} new ${posts.type}`);
  }

  /**
   * download media from post
   * @param {Object} media - object of the post media
   * @param {Boolean} isArchived - check to see if post type is archived
   */
  downloadMedia(media, isArchived) {
    const { id, source: { source } = {}, type, canView } = media;
    const path = isArchived ? `archived/${type}s` : `${type}s`;
    const fullPath = `${constants.DIR}/${this.profile}/${path}`;
    let ext = source.match(/\.\w+\?/i);

    if (!canView || (type != "photo" && type != "video") || ext.length == 0) {
      return;
    }

    ext = ext[0].slice(0, -1);
    const fileExt = `${id}${ext}`;
    const saveDir = `${fullPath}/${fileExt}`;

    if (!fs.existsSync(saveDir)) {
      this.newFiles += 1;
      try {
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath);
        }

        api
          .getFile(source, saveDir)
          .then(this.saveFile.bind(this))
          .catch(err => new Error(err));
      } catch (err) {
        console.error(err);
        return;
      }
    }
  }

  /**
   * save file buffer to directory
   * @param {Object} param0
   * @param {Buffer} param0.data
   * @param {string} param0.filePath
   */
  saveFile({ data, filePath }) {
    const file = fs.createWriteStream(filePath);
    file.write(data);
    file.end();
    this.downloaded += 1;
    console.log(`Downloaded: ${filePath} (${this.downloaded}/${this.newFiles})`);
  }
}

module.exports = ProcessFile;
