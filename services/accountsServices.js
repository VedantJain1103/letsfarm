const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const sgMail = require('@sendgrid/mail')
const dotenv = require('dotenv');
require('dotenv').config();


const uri = "mongodb+srv://vedant:vedant@cluster0.kuo0csq.mongodb.net/letsfarm?retryWrites=true&w=majority";
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
            if (data) {
                if (data.isProfileComplete||req.route.path=="/profile/completion/:cipherTextEmail") next();
                else res.redirect(`/users/profile/completion/${cipherTextEmail}`);
            }
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
    let code = generateVerificationCode();
    const reqBody = {
        userEmail: email,
        code: code
    };
    // sendMail(email, code);
    console.log(email, code);
    fetch(
        "https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/createVerification?secret=alwaysShine",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify(reqBody),
        }
    )
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log("Request succeeded with JSON response", data);
            return callback(null);
        })
        .catch(function (error) {
            console.log("Request failed", error);
            return callback(error);
        });
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

async function checkVerification(email, code, callback) {
    const verification = await fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/getVerificationByEmail?secret=alwaysShine&userEmail="+email, {
            method: "GET",
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // console.log('Request succeeded with JSON response', data);
            return data;
        }).catch(function (error) {
            console.log('Request failed', error);
            return callback(error);
        });
    if (verification) {
        const currDate = Date.now();
        if (currDate - verification.createdAt > 600000) {
            sendEmailVerification(email, function (error) {
                if (error) return callback(error);
                else {
                    return callback("Code Expired. We have sent a new verification Code");
                }
            });
        }
        else if (verification.code == code) {
            const reqBody = {
                userEmail: email,
                verificationStatus: true
            }
            fetch(
                "https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/updateUserEmailVerificationStatusByEmail?secret=alwaysShine",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: JSON.stringify(reqBody),
                }
            )
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    // console.log("send response")
                    return callback(null,true);
                })
                .catch(function (error) {
                    console.log("Request failed", error);
                    return callback(error);
                });
        }
        else {
            return callback("Incorrect Code");
        }
    } else {
        sendEmailVerification(email, function (error) {
            if (error) return callback(error);
            else {
                return callback("We have sent a verification Code");
            }
        })
    }
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

async function profileCompletion(email, userImage, userCertificate, addressLine1, addressLine2, addressPinCode, addressCity, addressState, addressCountry, callback) {
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
    if (!user) return callback("User Not Found");

    const awsUserImage = await userImageS3.uploadFile(userImage); // UPLOADING IMAGE
    // console.log(`users/image/${imageUpload.key}`); 
    await unlinkFile(userImage.path);
    const awsUserCertificate = await userCertificateS3.uploadFile(userCertificate); // UPLOADING CERTIFICATE
    // console.log(`users/certificate/${certificateUpload.key}`);
    await unlinkFile(userCertificate.path);

    const reqBody = {
        email: email,
        awsUserImage: awsUserImage,
        awsUserCertificate: awsUserCertificate,
        addressLine1: addressLine1,
        addressLine2: addressLine2,
        addressPinCode: addressPinCode,
        addressCity: addressCity,
        addressState: addressState,
        addressCountry: addressCountry,
    };
    fetch(
                "https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/completeProfile?secret=alwaysShine",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: JSON.stringify(reqBody),
                }
            )
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    console.log(data)
                    return callback(null,true);
                })
                .catch(function (error) {
                    console.log("Request failed", error);
                    return callback(error);
                });

}
module.exports = {
    isAuthentic,
    getUser,
    getUserById,
    createUser,
    signIn,
    sendEmailVerification,
    checkVerification,
    profileCompletion,
};