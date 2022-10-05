var express = require('express');
var router = express.Router();

var categoryServices = require('../services/categoryServices');

/* GET users listing. */
router.get('/', function (req, res, next) {
    imgModel.find({}, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.render('imagesPage', { items: items });
        }
    });
});

router.get('/create', function (req, res, next) {
    res.render('category/create');
});

router.post('/create', function (req, res, next) {
    const { name } = req.body;
    categoryServices.create('vedantjain35@gmail.com', name, function (error) {
        if (error) {
            console.log(error);
        }
        res.redirect('/users');
    })
});

module.exports = router;