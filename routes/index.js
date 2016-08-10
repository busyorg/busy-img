var express = require('express');
var router = express.Router();

var cloudinary = require('cloudinary'),
  multipart = require('connect-multiparty'),
  multipartMiddleware = multipart(),
  http = require('http');

router.get('/@:username', function(req, res, next) {
  var isEmpty = false;
  var username = req.params.username;
  var url = cloudinary.url('@' + username, {width: 128, height: 128, crop: 'fill'});
  http.get(url, function(response) {
    if (response.statusCode === 200) {
      return response.pipe(res);
    } else {
      isEmpty = true;
      var url = cloudinary.url('@busy', {width: 128, height: 128, crop: 'fill'});
      http.get(url, function(empty) {
        if (empty.statusCode === 200) {
          return empty.pipe(res);
        }
        empty.resume();
        res.setHeader('Content-Type', empty.headers['content-type']);
        res.sendStatus(empty.statusCode);
      });
    }
    if (!isEmpty) {
      response.resume();
      res.setHeader('Content-Type', response.headers['content-type']);
      res.sendStatus(response.statusCode);
    }
  });
});

router.post('/@:username', multipartMiddleware, function(req, res, next) {
  var username = req.params.username;
  var file = req.files[0];
  var path = file[Object.keys(file)[0]].path;
  cloudinary.uploader.upload(path, function(result) {
    console.log(result);
  });
  delete req.files;
  res.json();
});


module.exports = router;