const cloudinary = require('cloudinary');
const express = require('express');
const request = require('request');
const limiter = require('limiter');
const multipart = require('connect-multiparty');
const debug = require('debug')('busy-img');
const { createClient } = require('steem-mini');
const { getAvatarURL, getAccountsAsync } = require('../helpers');

const client = createClient(process.env.STEEMJS_URL || 'https://api.steemit.com/');

const multipartMiddleware = multipart();
// 2000 calls an hour because we're on the Bronze plan, usually would be 500
const cloudinaryRateLimiter = new limiter.RateLimiter(2000, 'hour');
const router = express.Router();

const defaultAvatar = getAvatarURL(8);
const defaultCover =
  'https://res.cloudinary.com/hpiynhbhq/image/upload/v1501527249/transparent_cliw8u.png';

const getImageLink = (url, defaultUrl, options) => {
  if (typeof url !== 'string') throw new Error('url has to be string');
  if (typeof defaultUrl !== 'string')
    throw new Error('defaultUrl has to be string');
  if (typeof options !== 'object') throw new Error('options has to be object');

  const fetchOptions = Object.assign({}, options, {
    type: 'fetch',
    sign_url: true,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    request.head({
      url,
      timeout: 1000,
    }, function(err, response) {
      if (err) {
        resolve(cloudinary.url(defaultUrl, fetchOptions));
        return;
      }

      const contentType = response.headers['content-type'] || '';
      if (response.statusCode == 200 && /image\/./.test(contentType)) {
        resolve(cloudinary.url(url, fetchOptions));
      } else {
        resolve(cloudinary.url(defaultUrl, fetchOptions));
      }
    });
  });
};

router.get('/@:username', async (req, res) => {
  const username = req.params.username;
  const width = req.query.width || req.query.w || req.query.size || req.query.s || 128;
  const height = req.query.height || req.query.h || req.query.size || req.query.s || 128;
  const crop = req.query.crop || 'fill';
  const options = { width: width, height: height, crop: crop };

  let account;
  try {
    [account] = await getAccountsAsync(client, [username]);
  } catch (e) {
    console.error('Error encountered while loading user profile', e);
  }

  let imageURL;
  if (account && account.id) {
    try {
      let jsonMetadata = account.json_metadata;
      if (jsonMetadata.length) {
        jsonMetadata = JSON.parse(jsonMetadata);
        imageURL = jsonMetadata.profile && jsonMetadata.profile.profile_image;
      }
    } catch (e) {
      console.error('Error encountered while retrieving profile image from json metadata');
    }
  }

  const defaultUrl = getAvatarURL(account.id);

  if (!imageURL) imageURL = (account && account.id) ? defaultUrl : defaultAvatar;

  res.redirect(await getImageLink(imageURL, defaultUrl, options));
});

router.get('/@:username/cover', async (req, res) => {
  const username = req.params.username;
  const width = req.query.width || req.query.w || req.query.size || req.query.s || 1024;
  const height = req.query.height ||req.query.h || req.query.size || req.query.s || 256;
  const crop = req.query.crop || 'mfit';
  const options = { width: width, height: height, crop: crop };

  let account;
  try {
    [account] = await getAccountsAsync(client, [username]);
  } catch (e) {
    console.log('Error encountered while loading user profile', e);
  }

  let imageURL;
  if (account && account.id) {
    try {
      let jsonMetadata = account.json_metadata;
      if (jsonMetadata.length) {
        jsonMetadata = JSON.parse(jsonMetadata);
        imageURL = jsonMetadata.profile && jsonMetadata.profile.cover_image;
      }
    } catch (e) {
      console.log('Error encountered while retrieving cover image from json metadata');
    }
  }

  if (!imageURL) imageURL = defaultCover;

  res.redirect(await getImageLink(imageURL, defaultCover, options));
});

router.post('/@:username', multipartMiddleware, (req, res, next) => {
  const username = req.params.username;
  const file = req.files;
  const path = file[Object.keys(file)[0]].path;
  cloudinary.uploader.upload(path, (result) => {
    res.json({ url: result.url });
  }, {
      public_id: '@' + username,
      tags: [
        '@' + username,
        'profile_image'
      ]
    });
  delete req.files;
});

router.post('/@:username/cover', multipartMiddleware, (req, res, next) => {
  const username = req.params.username;
  const file = req.files;
  const path = file[Object.keys(file)[0]].path;
  cloudinary.uploader.upload(path, (result) => {
    res.json({ url: result.url });
  }, {
      public_id: '@' + username + '/cover',
      tags: [
        '@' + username,
        'cover_image'
      ]
    });
  delete req.files;
});

/*!
 * POST /@:username/uploads
 *
 * Uploads a file to cloudinary and responds with the result. Requires one
 * multipart form file field
 */

router.post('/@:username/uploads', multipartMiddleware, (req, res, next) => {
  const username = req.params.username;
  const files = req.files;
  const keys = Object.keys(files);

  if (!keys[0]) {
    const err = new Error('Missing a file parameter');
    err.status = 422;
    return next(err);
  }

  const path = files[keys[0]].path;
  cloudinary.uploader.upload(path, (result) => {
    res.status(201);
    res.json(result);
  }, {
      tags: [
        '@' + username,
        'general-upload'
      ]
    });
});

/*!
 * GET /@:username/uploads
 *
 * Gets an user's uploads by querying cloudinary for its tag
 */

router.get('/@:username/uploads', (req, res, next) => {
  const username = req.params.username;
  cloudinaryRateLimiter.removeTokens(1, () => {
    // ^^ Error isn't relevant here, see
    // https://www.npmjs.com/package/limiter#usage
    cloudinary.api.resources_by_tag('@' + username, (result) => {
      res.json(result.resources);
    });
  });
});

module.exports = router;
