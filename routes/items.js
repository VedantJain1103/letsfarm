var express = require('express');
var router = express.Router();

const category = require('../models/category');

var itemsServices = require('../services/itemsServices');
var categoryServices = require('../services/categoryServices')
const { encrypt, decrypt } = require('../services/encryptionServices');
const { getFileStream } = require('../services/s3');

/* GET users listing. */
router.get('/image/:key', (req, res) => {
    const { key } = req.params;
    console.log(key)
    const readStream = getFileStream(key)

    readStream.pipe(res)
})

router.get('/:cipherTextEmail', async function (req, res, next) {
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    try {
        itemsServices.viewItemList(function (error, items) {
            let encItemIds = [];
            if (error) {
                console.log(error);
            }
            else {
                items.forEach(item => {
                    const encId = encrypt((item._id).toString());
                    encItemIds.push(encId);
                });
            }
            // res.send(items);
            res.render('item/listItems.ejs', { items, encItemIds, cipherTextEmail });
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/users/${cipherTextEmail}`);
    }
});

router.get('/c/:cipherTextEmail', async function (req, res, next) {
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    try {
        itemsServices.viewItemListOfUser(email, function (error, items) {
            let encItemIds = [];
            if (error) {
                console.log(error);
            }
            else {
                items.forEach(item => {
                    const encId = encrypt((item._id).toString());
                    encItemIds.push(encId);
                });
            }
            res.render('item/listItems.ejs', { items, encItemIds, cipherTextEmail });
        })
    } catch (error) {
        console.log(error);
        res.redirect(`/users/${cipherTextEmail}`);
    }
})

router.get('/view/:cipherTextItem/:cipherTextEmail', async function (req, res, next) {
    const { cipherTextEmail, cipherTextItem } = req.params;
    const email = decrypt(cipherTextEmail);
    const itemId = decrypt(cipherTextItem);
    itemsServices.getItemById(itemId, function (error, item) {
        if (error) {
            console.log(error);
        }
        // console.log(item[0]);
        res.render('item/viewItem.ejs', { item: item[0], cipherTextItem, cipherTextEmail })
    })
})

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

router.get('/update/:cipherTextItem/:cipherTextEmail', function (req, res, next) {
    const { cipherTextItem, cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    const itemId = decrypt(cipherTextItem);
    categoryServices.listCategory(function (errorCategory, categories) {
        if (errorCategory) {
            res.send(errorCategory);
        } else {
            itemsServices.getItemById(itemId, function (errorItem, item) {
                if (errorItem) {
                    res.send(errorItem);
                } else {
                    // console.log(item[0]);
                    res.render('item/update', { item: item[0], categories, cipherTextEmail, cipherTextItem });
                }
            });
        }
    })
});

router.post('/update/:cipherTextItem/:cipherTextEmail', function (req, res, next) {
    const { cipherTextItem, cipherTextEmail } = req.params;
    let { name, costPrice, category, sellPrice, discount, description, unit, minUnit, availUnit } = req.body;
    const email = decrypt(cipherTextEmail);
    const itemId = decrypt(cipherTextItem);
    itemsServices.getItemById(itemId, function (error, item) {
        if (error) {
            res.send(error);
        } else {
            if (email != item[0].seller.email) {
                res.send('Invalid authentication');
            } else {
                if (name == null) name = item[0].name;
                if (costPrice == null) costPrice = item[0].costPrice;
                if (category == null) category = item[0].category;
                if (sellPrice == null) sellPrice = item[0].sellPrice;
                if (discount == null) discount = item[0].discount;
                if (description == null) description = item[0].description;
                if (unit == null) unit = item[0].unit;
                if (minUnit == null) minUnit = item[0].minimumUnit;
                if (availUnit == null) availUnit = item[0].availableUnit;

                if (costPrice < 0 || sellPrice < 0 || discount < 0 || minUnit < 0 || availUnit < 0) {
                    res.send('Invalid Updation Request');
                } else {
                    categoryServices.getCategoryByName(category, function (errorCategory, categoryResult) {
                        itemsServices.updateItem(itemId, name, costPrice, category, sellPrice, discount, description, unit, minUnit, availUnit, function (errorUpdate, updatedItem) {
                            if (errorUpdate) {
                                res.send(errorUpdate);
                            } else {
                                console.log(updatedItem);
                                res.redirect(`/items/${cipherTextEmail}`);
                            }
                        });
                    });
                }
            }
        }
    });
})

module.exports = router;