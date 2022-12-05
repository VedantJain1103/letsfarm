const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://vedant:vedant@cluster0.kuo0csq.mongodb.net/letsfarm?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const database = client.db("LetUsFarm");

var categoryServices = require('../services/categoryServices');
var accountsServices = require('../services/accountsServices');
const { uploadFile } = require('./s3');
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
const category = require('../models/category');

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

async function viewItemList(callback) {
    try {
        const result = [];
        // const items = await ItemModel.find({}).limit(20);
        const items = await ItemModel.aggregate([
            {
                $limit: 20
            },
            {
                $lookup:
                {
                    from: "Users",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "seller"
                }
            },
            {
                $unwind: `$seller`
            },
            {
                $lookup:
                {
                    from: "Category",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                }
            },
            {
                $unwind: `$category`,
            },
            {
                $lookup: {
                    from: "Images",
                    localField: "_id",
                    foreignField: "itemId",
                    as: "image",
                }
            },
            {
                $unwind: `$image`,
            },
        ]);
        const data = JSON.stringify(items);
        // console.log(data);
        return callback(null, items);
    } catch (error) {
        return callback(error);
    }
}

async function viewItemListOfUser(email, callback) {
    try {
        const result = [];
        // const items = await ItemModel.find({}).limit(20);
        UserModel.findOne({ email: email }, (error, user) => {
            if (error) {
                console.log(error);
                return callback(error);
            }
            else {
                ItemModel.aggregate([
                    {
                        $match: { sellerId: user._id },
                    },
                    {
                        $lookup:
                        {
                            from: "Users",
                            localField: "sellerId",
                            foreignField: "_id",
                            as: "seller"
                        }
                    },
                    {
                        $unwind: `$seller`
                    },
                    {
                        $lookup:
                        {
                            from: "Category",
                            localField: "categoryId",
                            foreignField: "_id",
                            as: "category",
                        }
                    },
                    {
                        $unwind: `$category`,
                    },
                    {
                        $lookup: {
                            from: "Images",
                            localField: "_id",
                            foreignField: "itemId",
                            as: "image",
                        }
                    },
                    {
                        $unwind: `$image`,
                    },
                ], (error, items) => {
                    if (error) {
                        console.log(error);
                        return callback(error);
                    } else {
                        return callback(null, items);
                    }
                });
            }
        });
    } catch (error) {
        return callback(error);
    }
}

function getItemById(id, callback) {
    ItemModel.aggregate([
        {
            $match: { _id: ObjectId(id) },
        },
        {
            $lookup:
            {
                from: "Users",
                localField: "sellerId",
                foreignField: "_id",
                as: "seller"
            }
        },
        {
            $unwind: `$seller`
        },
        {
            $lookup:
            {
                from: "Category",
                localField: "categoryId",
                foreignField: "_id",
                as: "category",
            }
        },
        {
            $unwind: `$category`,
        },
        {
            $lookup: {
                from: "Images",
                localField: "_id",
                foreignField: "itemId",
                as: "image",
            }
        },
        {
            $unwind: `$image`,
        },
    ], (error, items) => {
        if (error) {
            console.log(error);
            return callback(error);
        } else {
            return callback(null, items);
        }
    });
}

function createItem(userEmail, itemName, category, image, costPrice, sellPrice, discount, description, unit, minUnit, availUnit, callback) {
    UserModel.find({ email: userEmail }, (error, user) => {
        if (error) {
            console.log(error);
            return callback(error);
        } else if (!user) {
            console.log("User Not Found");
            return callback('User not found');
        } else {
            CategoryModel.find({ name: category }, (error2, category) => {
                if (error2) {
                    console.log(error2);
                    return callback(error2);
                } else if (!category) {
                    console.log("Category not found");
                    return callback('Category not found');
                } else {
                    const categoryId = ObjectId(category[0]._id);
                    const sellerId = ObjectId(user[0]._id);
                    const newItem = ItemModel({
                        name: itemName,
                        categoryId: categoryId,
                        costPrice: costPrice,
                        sellPrice: sellPrice,
                        discount: discount,
                        description: description,
                        unit: unit,
                        minimumUnit: minUnit,
                        sellerId: sellerId,
                        availableUnit: availUnit,
                    });
                    // console.log(newItem);
                    newItem.save(async function (error3, item) {
                        if (error3) {
                            console.log(error3);
                            return callback(error3);
                        } else if (!item) {
                            console.log("Item not saved");
                            return callback('Item not saved');
                        } else {
                            const result = await uploadFile(image);
                            await unlinkFile(image.path);
                            const newImage = new ImageModel({
                                itemId: item._id,
                                img: `/items/image/${result.key}`,
                                isDisplayImage: true,
                            })

                            newImage.save(function (error4, image) {
                                if (error4) {
                                    console.log(error4);
                                    return callback(error4);
                                } else {
                                    console.log("+++++Image Saved Successfully+++++++");
                                    // console.log(image);
                                    return callback(null);
                                }
                            })
                        }
                    });
                }
            })
        }
    })
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
    console.log(imageResult);
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