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

const defaultCover = 'https://res.cloudinary.com/hpiynhbhq/image/upload/v1501527249/transparent_cliw8u.png';

const showImage = (url, res) => {
  debug('showImage', url);
  return new Promise((resolve, reject) => {
    if (url) {
      request.get(url).on('response', (response) => {
        const contentType = response.headers['content-type'] || '';
        if (response.statusCode === 200 && contentType.search('image') === 0) {
          // res.writeHead(200, { 'Content-Type': contentType });
          // return resolve(response.pipe(res));
          res.redirect(url);
        } else {
          debug('showImage Img not found', url, response.statusCode, contentType);
          return reject(new Error('Img not found'));
        }
      });
    } else {
      debug('showImage invalid url not found', url);
      return reject(new Error('invalid url not found'))
    }
  });
};

const renderExternalImage = (url, res, defaultImage, options) => {
  const fetchOptions = Object.assign({}, options, {
    type: 'fetch',
    sign_url: true,
    secure: true,
    defaultImage,
  });
  const newUrl = cloudinary.url(url, fetchOptions);
  return showImage(newUrl, res).catch(() => {
    const failUrl = cloudinary.url(defaultImage, fetchOptions);
    return showImage(failUrl, res);
  });
};

router.get('/@:username', async (req, res) => {
  const username = req.params.username;
  const width = req.query.width || req.query.w || req.query.size || req.query.s || 128;
  const height = req.query.height || req.query.h || req.query.size || req.query.s || 128;
  let defaultImage = req.query.default || req.query.d;
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
    defaultImage = defaultImage || getAvatarURL(account.id);
    let jsonMetadata = account.json_metadata;
    if (jsonMetadata.length) {
      jsonMetadata = JSON.parse(jsonMetadata);
      imageURL = jsonMetadata.profile && jsonMetadata.profile.profile_image;
    }
  } else {
    defaultImage = getAvatarURL(8);
  }
  imageURL = imageURL || defaultImage;
  return renderExternalImage(imageURL, res, defaultImage, options);
});

router.get('/@:username/cover', async (req, res) => {
  const username = req.params.username;
  const width = req.query.width || req.query.w || req.query.size || req.query.s || 1024;
  const height = req.query.height ||req.query.h || req.query.size || req.query.s || 256;
  const defaultImage = req.query.default ||req.query.d || defaultCover;
  const crop = req.query.crop || 'mfit';
  const options = { width: width, height: height, crop: crop };

  let account;
  try {
    [account] = await getAccountsAsync(client, [username]);
  } catch (e) {
    console.error('Error encountered while loading user profile', e);
  }

  let imageURL;
  if (account) {
    let jsonMetadata = account.json_metadata;
    if (jsonMetadata.length) {
      jsonMetadata = JSON.parse(jsonMetadata);
      imageURL = jsonMetadata.profile && jsonMetadata.profile.cover_image;
    }
  }
  imageURL = imageURL || defaultImage;
  return renderExternalImage(imageURL, res, defaultImage, options);
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
