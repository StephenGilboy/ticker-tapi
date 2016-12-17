var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Ticker TAPI', description: 'Socket IO app to send fake stock ticker data for learning reactive programming.'});
});

module.exports = router;
