var express = require('express');
var router = express.Router();

require('dotenv').config()

var accountsServices = require('../services/accountsServices');
let itemServices = require('../services/itemsServices');
const userImageS3 = require('../services/userImageS3');
const userCertificateS3 = require('../services/userCertificateS3');

const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
var path = require('path');
var multer = require('multer');

const { encrypt, decrypt } = require('../services/encryptionServices');

router.get('/image/:key', (req, res) => {
    const { key } = req.params;
    console.log(key)
    const readStream = userImageS3.getFileStream(key)

    readStream.pipe(res)
})

router.get('/certificate/:key', (req, res) => {
    const { key } = req.params;
    console.log(key)
    const readStream = userCertificateS3.getFileStream(key)

    readStream.pipe(res)
})

router.get('/:cipherTextEmail', accountsServices.isAuthentic, function (req, res, next) {
  const { cipherTextEmail } = req.params;
  const email = decrypt(cipherTextEmail);
  console.log("Decrypted Email: ", email);
  res.send('Hello ' + email);
});

router.get('/profile/completion/:cipherTextEmail', accountsServices.isAuthentic, function (req, res, next) {
  const { cipherTextEmail } = req.params;
  const email = decrypt(cipherTextEmail);
  res.render('accounts/profileCompletion', { cipherTextEmail: cipherTextEmail, email: email });
});

router.post('/profile/completion/:cipherTextEmail', accountsServices.isAuthentic,itemServices.upload.any(), async function (req, res, next) {
  const { cipherTextEmail } = req.params;
  const [ image, certificate ] = req.files;
  console.log(image, certificate)
  const email = decrypt(cipherTextEmail);
  const imageUpload = await userImageS3.uploadFile(image);
  console.log(`users/image/${imageUpload.key}`); // UPLOADING IMAGE
  await unlinkFile(image.path);
  const certificateUpload = await userCertificateS3.uploadFile(certificate); // UPLOADING IMAGE
  console.log(`users/certificate/${certificateUpload.key}`);
  await unlinkFile(certificate.path);
  res.render('accounts/profileCompletion', { cipherTextEmail: cipherTextEmail, email: email });
});


module.exports = router;
