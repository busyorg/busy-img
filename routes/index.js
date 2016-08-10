var express = require('express');
var router = express.Router();

var cloudinary = require('cloudinary'),
  multipart = require('connect-multiparty'),
  multipartMiddleware = multipart(),
  http = require('http');

router.get('/@:username', function(req, res, next) {
  var username = req.params.username;
  var url = 'http://res.cloudinary.com/demo/image/upload/w_0.4/sample.jpg';
  url = cloudinary.url('@' + username, {width: 128, height: 128, crop: 'fill'});
  http.get(url, function(response) {
    if (response.statusCode === 200) {
      res.setHeader('Content-Type', response.headers['content-type']);
      return response.pipe(res);
    }
    response.resume();
    res.sendStatus(response.statusCode);
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