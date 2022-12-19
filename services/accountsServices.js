const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const sgMail = require('@sendgrid/mail')
const dotenv = require('dotenv');
require('dotenv').config();


const uri = "mongodb+srv://vedant:vedant@cluster0.kuo0csq.mongodb.net/letsfarm?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const database = client.db("LetUsFarm");

const UserModel = require("../models/user")
const VerificationModel = require('../models/verification');
const callback = require('callback');

const { encrypt, decrypt } = require('../services/encryptionServices');

/*-----------Middleware----------------*/
function isAuthentic(req, res, next) {
    const { cipherTextEmail } = req.params;
    const email = decrypt(cipherTextEmail);
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getUserByEmail?secret=alwaysShine&email="+email, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            if (data) next();
            else res.send("User not Found.\nPlease Log-in.");
        }).catch(function (error) {
            console.log('Request failed', error);
            res.send("User not Found.\nPlease Log-in."+error);
        });
}

/*-------------------Functions----------------------*/
function getUser(email, callback) {
    fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getUserByEmail?secret=alwaysShine&email="+email, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            if (data) return callback(null, data);
            else return callback("User Not Found");
        }).catch(function (error) {
            console.log('Request failed', error);
            return callback(error);
        });
}
function getUserById(id, callback) {
     fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getUserById?secret=alwaysShine&userId="+id, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            if (data) return callback(null, data);
            else return callback("User Not Found");
        }).catch(function (error) {
            console.log('Request failed', error);
            return callback(error);
        });
}

async function createUser(fullName, email, phone, password, callback) {
    //checking if the user data already exists
    const user = await fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getUserByEmailOrPhone?secret=alwaysShine&email="+email+"&phone="+phone, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            return  data;
        }).catch(function (error) {
            console.log('Request failed', error);
            return error;
        });
    if (user) {
        return callback("User already exists");
    }

    // hashing password and adding user
    bcrypt.genSalt(10, function (saltError, salt) {
        if (saltError) {
            return callback(saltError);
        } else {
            bcrypt.hash(password, salt, function (hashError, hash) {
                if (hashError) {
                    return callback(hashError);
                }
                console.log(hash);
                const reqBody = {
                    fullName: fullName,
                    email: email,
                    password: hash,
                    phone: phone,
                };
                // console.log(reqBody)
                fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/createUser?secret=alwaysShine", {
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
            });
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
                else {
                    let code = generateVerificationCode();
            const newVerificationDbDoc = new VerificationModel({
                email: email,
                code: code,
                dateCreated: currDate
            })
            sendMail(email, code);
            newVerificationDbDoc.save();
                    return callback(false);
                }
            });
            
        }
    })
}

function sendMail(email, code) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    console.log(email, code);
    const msg = {
        to: email, // Change to your recipient
        from: 'vedantjain35@gmail.com', // Change to your verified sender
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
async function signIn(email, password, callback) {
    const user = await fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getUserByEmail?secret=alwaysShine&email="+email, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            if (data) return data;
            else return callback("User Not Found");
        }).catch(function (error) {
            console.log('Request failed', error);
            return callback(error);
        });
    if (!(user.isEmailVerified)) {
        return callback(false, true, false);
    }
    bcrypt.compare(password, user.password, function (error, isMatch) {
        if (error) {
            return callback(error)
        } else if (!isMatch) {
            return callback("Wrong Password")
        } else {
            return callback(false, true, true);
        }
    })
}

module.exports = {
    isAuthentic,
    getUser,
    getUserById,
    createUser,
    signIn,
    sendEmailVerification,
    checkVerification,
};