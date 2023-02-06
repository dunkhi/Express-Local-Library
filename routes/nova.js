var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
   res.render('nova', { name: 'Nova'})
   // res.send('Hello Nova! Nodemon?');
});

module.exports = router;