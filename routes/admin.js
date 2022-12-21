var express = require('express');
var router = express.Router();

require('dotenv').config()

const adminServices = require('../services/adminServices');
const accountsServices = require('../services/accountsServices');
const itemServices = require('../services/itemsServices');
const userImageS3 = require('../services/userImageS3');
const userCertificateS3 = require('../services/userCertificateS3');

const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
var path = require('path');
var multer = require('multer');

const { encrypt, decrypt } = require('../services/encryptionServices');

router.get('/unreviewedUsers', function (req, res, next) {
    adminServices.getUnreviewedUsers(function (error, users) {
        let encUsersEmail = [];
        if (error) {
            res.send(error);
        } else {
            users.forEach(user => {
                const encEmail = encrypt(user.email);
                encUsersEmail.push(encEmail);
            });
            // console.log(result, encUsersEmail);
        }
        // res.send(users);
        res.render('admin/unreviewedUsers.ejs', { users:users, encUsersEmail });
    })
});

router.get('/view/:cipherTextEmail', function (req, res, next) {
    const { cipherTextEmail } = req.params;
    const userEmail = decrypt(cipherTextEmail);
    accountsServices.getUserProfileByEmail(userEmail, function (error, user) {
        if (error) {
            res.send(error);
        } else {
            res.render('admin/viewUnreviewedUser', { user });
        }
    })
})

router.post('/view/:cipherTextEmail/approve', function (req, res, next) {
    const { cipherTextEmail } = req.params;
    
})
module.exports = router;
