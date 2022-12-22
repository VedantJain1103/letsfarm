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
/*-------------middleware------------*/

/*------------Function---------------*/
function viewItemUnits(callback) {
    fetch(" https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/listItemUnits?secret=alwaysShine", {
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

function updateItem(email, itemId, name, costPrice, category, discount, description, availableUnit, callback) {
    if (!itemId || costPrice < 0 ||  discount < 0 || availableUnit < 0 || discount > 100) {
        return callback("Invalid Data");
    }
    const reqBody = {
        email: email,
        itemId: itemId,
        name: name,
        costPrice: costPrice,
        categoryName: category,
        discount: discount,
        description: description,
        availableUnit: availableUnit
    }
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/updateItem?secret=alwaysShine", {
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
        if (data === "ItemId required") return callback("ItemId required");
        if (data === "Item Not Found") return callback("Item Not Found");
        if (data === "Invalid Authentication") return callback("Invalid Authentication");
        // console.log(data);
        return callback(null, data);
    }).catch(function (error) {
        console.log('Request failed', error);
        return callback(error);
    });
}

async function updateItemImage(email, itemId, image, callback) {
    const imageResult = await itemImageS3.uploadFile(image);
    await unlinkFile(image.path);
    // console.log(imageResult);
    const reqBody = {
        email: email,
        itemId: itemId,
        imageLink: `/items/image/${imageResult.key}`,
    }
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/updateItemImage?secret=alwaysShine", {
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
        if (data === "ItemId required") return callback("ItemId required");
        if (data === "Item Not Found") return callback("Item Not Found");
        if (data === "Invalid Authentication") return callback("Invalid Authentication");
        console.log(data);
        return callback(null, data);
    }).catch(function (error) {
        console.log('Request failed', error);
        return callback(error);
    });
}

module.exports = {
    upload,
    viewItemUnits,
    viewItemListOfUser,
    viewItemList,
    getItemById,
    createItem,
    updateItem,
    updateItemImage,
};