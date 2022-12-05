var express = require('express');
var router = express.Router();

var accountsServices = require('../services/accountsServices');
var categoryServices = require('../services/categoryServices');

const { encrypt, decrypt } = require('../services/encryptionServices');

/* GET users listing. */
router.get('/:cipherTextEmail',accountsServices.isAuthentic, function (req, res, next) {
    categoryServices.listCategory((error, categories) => {
        if (error) {
            res.send(error);
        } else {
            res.send(categories);
        }
    })
});

router.get('/create/:cipherTextEmail',accountsServices.isAuthentic, function (req, res, next) {
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    res.render('category/create', { cipherTextEmail });
});

router.post('/create/:cipherTextEmail', accountsServices.isAuthentic, function (req, res, next) {
    const { name } = req.body;
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    categoryServices.create(email, name, function (error) {
        if (error) {
            console.log(error);
        }
        res.redirect(`/items/{{$cipherTextEmail}}`);
    })
});

module.exports = router;