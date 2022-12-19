const express = require('express');
require('dotenv').config()

const router = express.Router();

const accountsServices = require('../services/accountsServices');
const { encrypt, decrypt } = require('../services/encryptionServices');

router.get('/signIn', (req, res) => {
    res.render('accounts/signIn', { title: 'Express', email: '' });
});

router.get('/register', (req, res) => {
    res.render('accounts/register');
});

router.get('/:email/verification', (req, res) => {
    const { email } = req.params;
    res.render('accounts/verification', { email: email });
});

router.post('/register', async (req, res) => {
    const { fullName, email, phone, password, confirmPassword } = req.body;
    if (password == null || (password != confirmPassword)) res.render('accounts/register', { error: "Passwords do not match" });
    else {
        let strongPasswordRe = new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})');
        // atleast one lower case char
        // atleast one upper case char
        // atleast one digit
        // atleast one special char
        // atleast of length 8
        if (strongPasswordRe.test(password)) {
            accountsServices.createUser(fullName, email, phone, password, function (error) {
                if (error) {
                    res.render('accounts/register', { error: error, fullName, email, phone });
                } else {
                    res.redirect(`/accounts/sendVerificationCode`);
                }
            });
        } else {
            res.render('accounts/register', { error: 'Enter a valid Password', fullName, email, phone });
        }
    }
});


router.post('/:email/verification', async (req, res) => {
    try {
        const { email } = req.params;
        const { code } = req.body;
        await accountsServices.checkVerification(email, code, function (error, status) {
            if (error) {
                console.log(error);
                res.render('accounts/verfication', { error:error, email:email });
            } else if (status) {
                const ciphertextEmail = encrypt(email);;
                res.redirect(`/users/${ciphertextEmail}`);
            }
        })
    } catch (error) {
        res.render('accounts/verfication', { error, email });
    }
});

router.post('/signIn', async (req, res) => {
    const { email, password } = req.body;
    accountsServices.signIn(email, password, function (error, status, isVerified) {
        if (error) {
            const msg = "Invalid Username or Password";
            res.render('accounts/signIn', { error: msg, email: email });
        }
        else if (status) {
            if (isVerified) {
                let ciphertextEmail = encrypt(email);
                res.redirect(`/users/${ciphertextEmail}`);
            }
            else {
                accountsServices.sendEmailVerification(email, function (error) {
                    if (error) {
                        res.render('accounts/signIn', { error, email });
                    } else {
                        res.redirect(`/accounts/` + email + `/verification`);
                    }
                });
            }
        }
        else {
            res.render('accounts/signIn', { error: "An error occurred", email });
        }
    });
});


module.exports = router;