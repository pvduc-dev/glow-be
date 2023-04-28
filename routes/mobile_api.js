var express = require('express');
var router = express.Router();

const UserController = require('../controllers').UserController
const AuthController = require('../controllers').AuthController

/* Auth Router. */
router.post('/api/login', AuthController.login);


module.exports = router;
