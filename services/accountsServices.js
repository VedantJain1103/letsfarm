const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const sgMail = require('@sendgrid/mail')

const uri = "mongodb+srv://vedant:vedant@letusfarm.odp3iea.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const database = client.db("LetUsFarm");
const Users = database.collection("Users");

const UserModel = require("../models/user")
const VerificationModel = require('../models/verification');

function getUser(email, callback) {
    UserModel.findOne({ email: email }).exec(function (error, user) {
        if (error) {
            return callback(true);
        } else if (!user) {
            return callback(false, null);
        } else {
            return callback(false, user);
        }
    })
}

function createUser(fullName, email, phone, password, callback) {
    UserModel.findOne({
        $or: [
            { phone: phone },
            { email: email }
        ]
    }, function (error, existingUser) {
        if (error) {
            return callback(error);
        } else if (existingUser) {
            return callback("Account with given Email or Mobile number already exists");
        } else {
            const newUserDbDoc = new UserModel({
                fullName: fullName,
                email: email,
                phone: phone,
                password: password,
            });
            newUserDbDoc.save();
            return callback(null);
        }
    });
}

function generateVerificationCode() {
    const max = 999999;
    const min = 100000;
    let code = Math.floor(Math.random() * (max - min + 1)) + min;
    return code;
}

function sendEmailVerification(email, callback) {
    VerificationModel.findOne({ email: email }).exec(function (error, verifcation) {
        if (error) {
            return callback(true);
        } else if (!verifcation) {
            let code = generateVerificationCode();
            let currDate = Date.now();
            const newVerificationDbDoc = new VerificationModel({
                email: email,
                code: code,
                dateCreated: currDate
            })
            newVerificationDbDoc.save();
            sendMail(email, code);
            return callback(false);
        } else {
            currDate = Date.now();
            console.log("verification present");
            VerificationModel.findOneAndDelete({ email: email }, function (error) {
                if (error) return callback(true);
            });
            let code = generateVerificationCode();
            const newVerificationDbDoc = new VerificationModel({
                email: email,
                code: code,
                dateCreated: currDate
            })
            newVerificationDbDoc.save();
            sendMail(email, code);
            return callback(false);
        }
    })
}

function sendMail(email, code) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
        to: email, // Change to your recipient
        from: 'vedantjain1008@gmail.com', // Change to your verified sender
        subject: 'Emaill Verification',
        text: `Your email verifcation code is ${code}`,
        html: `<h1>Thank you for registering</h1><br><strong>Your email verifcation code is ${code}</strong><br>
        This code will expire in 10 minutes`,
    }
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error)
        })
}

function checkVerification(email, code, callback) {
    VerificationModel.findOne({ email: email }).exec(function (error, verification) {
        if (error) {
            return callback("An error occured");
        } else if (!verification) {
            return callback(false, false);
        } else {
            const currDate = Date.now();
            if (currDate - verification.createdAt > 600000) {
                VerificationModel.findOneAndDelete({ email: email }, function (error) {
                    if (error) {
                        return callback(error);
                    }
                });
                return callback("Code Expired");
            }
            if (verification.code === Number(code)) {
                UserModel.findOneAndUpdate({ email: email }, { isEmailVerified: true }, function (error, user) {
                    if (error) return callback(false, false, false);
                });
                VerificationModel.findOneAndDelete({ email: email }, function (error) {
                    if (error) return callback(false, false, false);
                });
                return callback(null, true, true);
            } else {
                return callback("Invalid Code and Email Combination", true, false);
            }
        }
    })
}
function signIn(email, password, callback) {
    UserModel.findOne({ email: email }).exec(function (error, user) {
        if (error) {
            return callback(true);
        } else if (!user) {
            return callback(true);
        } else {
            if (!user.isEmailVerified) {
                return callback(false, true, false);
            }
            user.comparePassword(password, function (matchError, isMatch) {
                if (matchError) {
                    return callback(true);
                } else if (!isMatch) {
                    return callback(true);
                } else {
                    return callback(false, true, true);
                }
            })
        }
    })
}

module.exports = {
    getUser,
    createUser,
    signIn,
    sendEmailVerification,
    checkVerification,
};