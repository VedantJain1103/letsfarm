const callback = require('callback');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = "mongodb+srv://vedant:vedant@cluster0.kuo0csq.mongodb.net/letsfarm?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const database = client.db("LetUsFarm");

const CategoryModel = require('../models/category');
const UserModel = require('../models/user');

function listCategory(callback) {
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/listCategory?secret=alwaysShine",{
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

function getCategoryById(id, callback) {
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getCategoryByName?secret=alwaysShine&categoryId="+id,{
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

function getCategoryByName(name, callback) {
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getCategoryByName?secret=alwaysShine&name="+name,{
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

async function create(userEmail, categoryName, callback) {
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
    
    // checking if the category already exists
    await fetch(" https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getCategoryByName?secret=alwaysShine&name="+categoryName, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            if (data) return callback("Category Exists");
        }).catch(function (error) {
            console.log('Request failed', error);
            return callback(error);
        });
    
    // adding category
    const reqBody = {
        name: categoryName,
        email: userEmail,
    }
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/createCategory?secret=alwaysShine", {
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
                    console.log('Request succeeded with JSON response', data);
                    return callback(null, data);
                }).catch(function (error) {
                    console.log('Request failed', error);
                    return callback(error);
                });
};

module.exports = {
    listCategory,
    getCategoryById,
    getCategoryByName,
    create,
};