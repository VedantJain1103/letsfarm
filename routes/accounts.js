const express = require('express');

const router = express.Router();

const accountsServices = require('../services/accountsServices');

router.get('/signIn', (req, res) => {
    res.render('accounts/signIn', { title: 'Express', email: '' });
});

router.get('/register', (req, res) => {
    res.render('accounts/register');
});

router.get('/sendVerificationCode', (req, res) => {
    res.render('accounts/sendVerificationCode');
})

router.get('/:email/verification', (req, res) => {
    const { email } = req.params;
    res.render('accounts/verification', { email: email });
});

router.post('/register', async (req, res) => {
    const { fullName, email, phone, password, confirmPassword } = req.body;
    // try {
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

            // const result = await accountsServices.createUser(fullName, email, phone, password);
            // if (result == "Email or Mobile Number already exists") res.render('accounts/register', { error: 'Email or Username already exists' });
            // else res.redirect(`/accounts/sendVerificationCode`);
        } else {
            res.render('accounts/register', { error: 'Enter a valid Password', fullName, email, phone });
        }
    }
    // } catch (err) {
    //     console.log("===============");
    //     res.render('accounts/register', { error: err.message });
    // }
});

router.post('/sendVerificationCode', async (req, res) => {
    const { email } = req.body;
    accountsServices.getUser(email, function (error, user) {
        if (error) {
            res.redirect('/accounts/register');
        } else if (!user) {
            res.redirect('/accounts/register');
        } else {
            if (user.isEmailVerified) res.redirect('/accounts/signIn');
            else {
                accountsServices.sendEmailVerification(email, function (error, status) {
                    console.log("Request Posted for Sending Code");
                    if (error) {
                        res.redirect('error');
                    } else {
                        res.redirect(`/accounts/${email}/verification`);
                    }
                });
            }
        }
    });
})

router.post('/:email/verification', (req, res) => {
    const { email } = req.params;
    const { code } = req.body;
    accountsServices.checkVerification(email, code, function (error, verifcationCodePresent, success) {
        if (error) {
            res.render('accounts/verification', { error: error, email: email });
        } else if (!verifcationCodePresent) {
            res.redirect(`/accounts/sendVerificationCode`);
        } else {
            if (success) {
                res.redirect('/accounts/signIn');
            } else {
                res.render('accounts/verification', { email: email, error: error });
            }
        }
    });
});

router.post('/signIn', async (req, res) => {
    const { email, password } = req.body;
    accountsServices.signIn(email, password, function (error, status, isVerified) {
        if (error) {
            const msg = "Invalid Username or Password";
            res.render('accounts/signIn', { error: msg, email: email });
        }
        else if (status) {
            if (isVerified) res.redirect('/users');
            else res.redirect(`/accounts/sendVerificationCode`);
        }
        else {
            res.render('accounts/signIn', { error: "An error occurred", email });
        }
    });
});


module.exports = router;