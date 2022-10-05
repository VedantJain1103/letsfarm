var express = require('express');
const category = require('../models/category');
var router = express.Router();

var itemsServices = require('../services/itemsServices');
var categoryServices = require('../services/categoryServices')

/* GET users listing. */
router.get('/', async function (req, res, next) {
    try {
        itemsServices.viewItemList(function (error, items) {
            if (error) {
                console.log(error);
            }
            // console.log(images);
            // res.contentType(images[0].img.contentType);
            // res.send(images[0].img.data);
            // console.log(items);
            res.render('item/listItems.ejs', { items: items });
        });
    } catch (error) {
        console.log(error);
        res.redirect('/users');
    }
});

router.get('/createItem', function (req, res, next) {
    categoryServices.listCategory(function (error, result) {
        if (error) {
            res.send(error);
        } else {
            res.render('item/create', { categories: result });
        }
    });
});

router.post('/createItem', itemsServices.upload.single('image'), function (req, res, next) {
    const { name, costPrice, category, sellPrice, discount, description, unit, minUnit, availUnit } = req.body;
    const image = req.file;
    // const fileName = Date.now()+'-'+req.file.originalname;
    // console.log(fileName, "abcadvchbadj vgb");
    console.log(req.body);
    itemsServices.createItem('vedantjain35@gmail.com', name, category, image, costPrice, sellPrice, discount, description, unit, minUnit, availUnit, function (error, success) {
        if (error) {
            console.log("----------Error occurred--------------");
        }
        res.redirect('/users');
    })
});

module.exports = router;