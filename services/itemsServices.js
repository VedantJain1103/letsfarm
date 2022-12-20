const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const database = client.db("LetUsFarm");

var categoryServices = require('../services/categoryServices');
var accountsServices = require('../services/accountsServices');
const itemImageS3 = require('./itemImageS3');
const { encrypt, decrypt } = require('../services/encryptionServices');

const CategoryModel = require('../models/category');
const ItemModel = require('../models/item');
const ImageModel = require('../models/image');
const UserModel = require('../models/user');

//multer
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
var path = require('path');
var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        const { cipherTextEmail } = req.params;
        const email = decrypt(cipherTextEmail);
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Months start at 0!
        let dd = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const formattedToday = dd + '' + mm + '' + yyyy;
        cb(null, formattedToday + '-' + email + '-' + file.originalname)
    }
});
var upload = multer({ storage: storage });

//

function viewItemList(callback) {
        fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/listItems?secret=alwaysShine", {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            return callback(null, data);
        }).catch(function (error) {
            return callback(error);
            console.log('Request failed', error);
        });
}

function viewItemListOfUser(email, callback) {
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getItemsOfUserByEmail?secret=alwaysShine&email="+email, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            return callback(null, data);
        }).catch(function (error) {
            return callback(error);
            console.log('Request failed', error);
        });
}

function getItemById(id, callback) {
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getItemById?secret=alwaysShine&itemId="+id, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            return callback(null, data);
        }).catch(function (error) {
            console.log('Request failed', error);
            return callback(error);
        });
}

async function createItem(userEmail, itemName, category, image, costPrice, sellPrice, discount, description, unit, minUnit, availUnit, callback) {
    //checking if the user exists or not
    await fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getUserByEmail?secret=alwaysShine&email="+userEmail, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            if (!data) return callback("User Not Registered");
        }).catch(function (error) {
            console.log('Request failed', error);
            return callback(error);
        });
    
    // checking if the catgeory exists or not
    await fetch(" https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getCategoryByName?secret=alwaysShine&name="+category, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            if (!data) return callback("Category Does not Exists");
        }).catch(function (error) {
            console.log('Request failed', error);
            return callback(error);
        });
    
    //adding item data
    const reqBody = {
        userEmail:userEmail, itemName:itemName, categoryName: category, costPrice: costPrice, sellPrice:sellPrice, discount:discount, description:description, unit:unit, minUnit:minUnit, availUnit:availUnit
    }
    const item = await fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/createItem?secret=alwaysShine", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: JSON.stringify(reqBody)
                }
                ).then(function (response) {
                    return response.json();
                }).then(function (data) {
                    // console.log('Request succeeded with JSON response', data);
                    return  data;
                }).catch(function (error) {
                    console.log('Request failed', error);
                    return callback(error);
                });
    //adding item image
    const result = await itemImageS3.uploadFile(image); // UPLOADING IMAGE
    await unlinkFile(image.path); //DELETING FROM SERVER DEVICE STORAGE
    const imageReqBody = {
        itemId: item.insertedId,
        imageLink: `/items/image/${result.key}`,
        email: userEmail,
    }
    await fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/createItemImage?secret=alwaysShine", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: JSON.stringify(imageReqBody)
                }
                ).then(function (response) {
                    return response.json();
                }).then(function (data) {
                    // console.log('Request succeeded with JSON response', data);
                    return callback(null, data);
                }).catch(function (error) {
                    console.log('Request failed', error);
                    return callback(error);
                });
};

function updateItem(itemId, name, costPrice, category, sellPrice, discount, description, unit, minimumUnit, availableUnit, callback) {

        ItemModel.updateOne(
            { "_id": ObjectId(itemId) },
            {
                $set: {
                    name, costPrice, categoryId: category._id, sellPrice, discount, description, minimumUnit, availableUnit, unit,
                }
            },
            { new: true },
            (error, result) => {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            }
        );
}

async function updateItemImage(itemId, image, callback) {
    const imageResult = await uploadFile(image);
    await unlinkFile(image.path);
    // console.log(imageResult);
    ImageModel.updateOne(
        { "itemId": ObjectId(itemId) },
        {
            $set: {
                img: `/items/image/${imageResult.key}`
            }
        },
        { new: true },
        (error, result) => {
            if (error) {
                return callback(error);
            } else {
                return callback(null, result);
            }
        }
    )
}

module.exports = {
    upload,
    viewItemListOfUser,
    viewItemList,
    getItemById,
    createItem,
    updateItem,
    updateItemImage,
};