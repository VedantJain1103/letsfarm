const callback = require('callback');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = "mongodb+srv://vedant:vedant@cluster0.kuo0csq.mongodb.net/letsfarm?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const database = client.db("LetUsFarm");

const CategoryModel = require('../models/category');
const UserModel = require('../models/user');

function listCategory(callback) {
    CategoryModel.find({}, function (error, result) {
        if (error) {
            return callback(error);
        } else {
            return callback(null, result);
        }
    })
}

async function getCategoryById(id) {
    try {
        const category = await CategoryModel.findOne({ _id: ObjectId(id) });
        return category;
    } catch (error) {
        console.log(error);
        return null;
    }
}
function create(userEmail, categoryName, callback) {
    UserModel.find({ email: userEmail }, (error, user) => {
        if (error) {
            return callback(error);
        } else if (!user) {
            return callback('User not found');
        } else {
            CategoryModel.find({ name: categoryName }, (error2, category) => {
                if (error2) {
                    return callback(error2);
                } else if (!category) {
                    return callback('Category not found');
                } else {
                    const userId = user[0]._id;
                    const newCategory = new CategoryModel({
                        name: categoryName,
                        createdBy: userId,
                        createdDate: Date.now(),
                        isActive: true,
                    })
                    newCategory.save(function (error) {
                        if (error) {
                            console.log("----------error while creating category--------");
                            console.log(error);
                        }
                        return callback(null);
                    })
                }
            })
        }
    })
};

module.exports = {
    listCategory,
    getCategoryById,
    create,
};