const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = "mongodb+srv://vedant:vedant@letusfarm.odp3iea.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const database = client.db("LetUsFarm");

var categoryServices = require('../services/categoryServices');
var accountsServices = require('../services/accountsServices');

const CategoryModel = require('../models/category');
const ItemModel = require('../models/item');
const ImageModel = require('../models/image');
const UserModel = require('../models/user');

//multer
var fs = require('fs');
var path = require('path');
var multer = require('multer');
const category = require('../models/category');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("f");
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        console.log("s");
        cb(null, 'vedantjain35@gmail.com-' + file.originalname)
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
                    from: "users",
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
                    from: "categories",
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
                    from: "images",
                    localField: "_id",
                    foreignField: "itemId",
                    as: "image",
                }
            },
            {
                $unwind: `$image`,
            },
        ]);
        return callback(null, items);
    } catch (error) {
        return callback(error);
    }
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
                    console.log(category);
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
                    newItem.save(function (error3, item) {
                        if (error3) {
                            console.log(error3);
                            return callback(error3);
                        } else if (!item) {
                            console.log("Item not saved");
                            return callback('Item not saved');
                        } else {

                            const newImage = new ImageModel({
                                itemId: item._id,
                                img: {
                                    data: fs.readFileSync(path.join(__dirname + '/../uploads/' + 'vedantjain35@gmail.com' + '-' + image.originalname)),
                                    contentType: 'image/jpeg'
                                },
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

module.exports = {
    upload,
    viewItemList,
    createItem,
};