var express = require('express');
var router = express.Router();

require('dotenv').config()

const { encrypt, decrypt } = require('../services/encryptionServices');

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('User Home Page');
});

router.get('/:cipherTextEmail', function (req, res, next) {
  const { cipherTextEmail } = req.params;
  const email = decrypt(cipherTextEmail);
  console.log("Decrypted Email: ", email);
  res.send('Hello ' + email);
});

module.exports = router;
