var express = require('express');
var router = express.Router();

var categoryServices = require('../services/categoryServices');
const { encrypt, decrypt } = require('../services/encryptionServices');

/* GET users listing. */
router.get('/:cipherTextEmail', function (req, res, next) {
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

router.get('/create/:cipherTextEmail', function (req, res, next) {
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    res.render('category/create', { cipherTextEmail });
});

router.post('/create/:cipherTextEmail', function (req, res, next) {
    const { name } = req.body;
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    categoryServices.create(email, name, function (error) {
        if (error) {
            console.log(error);
        }
        res.redirect('/users');
    })
});

module.exports = router;