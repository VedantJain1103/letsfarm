const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const sgMail = require('@sendgrid/mail')
const dotenv = require('dotenv');
require('dotenv').config();


const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const database = client.db("LetUsFarm");

const userImageS3 = require('../services/userImageS3'); 
const userCertificateS3 = require('../services/userCertificateS3');

const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

const UserModel = require("../models/user")
const VerificationModel = require('../models/verification');
const callback = require('callback');

const { encrypt, decrypt } = require('../services/encryptionServices');

/*-------------------Functions----------------------*/
function getUnreviewedUsers(callback) {
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/listUnreviewedUsers?secret=alwaysShine", {
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

function updateReviewStatus(email, reviewStatus, callback) {
    
}

module.exports = {
    getUnreviewedUsers,
};