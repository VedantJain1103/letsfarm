var express = require('express');
const category = require('../models/category');
var router = express.Router();

var itemsServices = require('../services/itemsServices');
var categoryServices = require('../services/categoryServices')
const { encrypt, decrypt } = require('../services/encryptionServices');

/* GET users listing. */
router.get('/:cipherTextEmail', async function (req, res, next) {
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    try {
        itemsServices.viewItemList(function (error, items) {
            if (error) {
                console.log(error);
            }
            res.render('item/listItems.ejs', { items: items });
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/users/${cipherTextEmail}`);
    }
});

router.get('/create/:cipherTextEmail', function (req, res, next) {
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    categoryServices.listCategory(function (error, result) {
        if (error) {
            res.send(error);
        } else {
            res.render('item/create', { categories: result, cipherTextEmail });
        }
    });
});

router.post('/create/:cipherTextEmail', itemsServices.upload.single('image'), function (req, res, next) {
    const { name, costPrice, category, sellPrice, discount, description, unit, minUnit, availUnit } = req.body;
    const image = req.file;
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    itemsServices.createItem(email, name, category, image, costPrice, sellPrice, discount, description, unit, minUnit, availUnit, function (error, success) {
        if (error) {
            console.log("----------Error occurred--------------");
        }
        res.redirect(`/items/${cipherTextEmail}`);
    })
});

module.exports = router;