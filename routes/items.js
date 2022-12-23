var express = require('express');
var router = express.Router();

const category = require('../models/category');

var accountsServices = require('../services/accountsServices');
var itemsServices = require('../services/itemsServices');
var categoryServices = require('../services/categoryServices')

const { encrypt, decrypt } = require('../services/encryptionServices');
const itemImageS3 = require('../services/itemImageS3');


router.get('/image/:key', (req, res) => {
    const { key } = req.params;
    // console.log(key)
    const readStream = itemImageS3.getFileStream(key)

    readStream.pipe(res)
})

router.get('/:cipherTextEmail', accountsServices.isAuthentic, function (req, res, next) {
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
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
});

router.get('/c/:cipherTextEmail', accountsServices.isAuthentic, async function (req, res, next) {
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
            res.render('item/listUserItems.ejs', { items, encItemIds, cipherTextEmail });
        })
    } catch (error) {
        console.log(error);
        res.redirect(`/users/${cipherTextEmail}`);
    }
})

router.get('/view/:cipherTextItem/:cipherTextEmail', accountsServices.isAuthentic, async function (req, res, next) {
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

router.get('/create/:cipherTextEmail',accountsServices.isAuthentic, accountsServices.isApproved, function (req, res, next) {
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

router.post('/create/:cipherTextEmail',accountsServices.isAuthentic,accountsServices.isApproved, itemsServices.upload.single('image'), function (req, res, next) {
    const { name, costPrice, category, discount, description, availUnit, months } = req.body;
    console.log(req.body);
    const image = req.file;
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    itemsServices.createItem(email, name, category, image, costPrice, discount, description, availUnit, months, function (error, success) {
        if (error) {
            console.log("----------Error occurred--------------",error);
        }
        res.redirect(`/items/c/${cipherTextEmail}`);
    })
});

router.get('/update/:cipherTextItem/:cipherTextEmail',accountsServices.isAuthentic,accountsServices.isApproved, function (req, res, next) {
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

router.post('/update/:cipherTextItem/:cipherTextEmail',accountsServices.isAuthentic,accountsServices.isApproved, function (req, res) {
    const { cipherTextItem, cipherTextEmail } = req.params;
    let { name, costPrice, category, discount, description, availableUnit } = req.body;
    // console.log(req.body) 
    const email = decrypt(cipherTextEmail);
    const itemId = decrypt(cipherTextItem);
    itemsServices.updateItem(email, itemId, name, costPrice, category, discount, description, availableUnit, function (error, result) {
        if (error) res.send(error);
        else {
            res.redirect(`/items/c/${cipherTextEmail}`)
        }
    })
});

router.post('/updateItemImage/:cipherTextItem/:cipherTextEmail',accountsServices.isAuthentic,accountsServices.isApproved, itemsServices.upload.single('image'), function (req, res, next) {
    const { cipherTextEmail, cipherTextItem } = req.params;
    const image = req.file;
    const email = decrypt(cipherTextEmail);
    const itemId = decrypt(cipherTextItem);
    itemsServices.updateItemImage(email, itemId, image, function (error, result) {
        if (error) res.send(error);
        else res.redirect(`/items/c/${cipherTextEmail}`);
    })
})

module.exports = router;