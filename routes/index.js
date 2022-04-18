var express = require('express');
var router = express.Router()

var mongoose = require("mongoose");
var userModel = require("../models/user")
var contractModel = require("../models/contract")
var optionModel = require("../models/option")
var bcrypt = require("bcrypt");
var uid2 = require("uid2");

/* Connexion à l'espace */

router.post('/signIn', async function(req, res, next){
  var error = "";
  var response = false;
  var token;
  var password = req.body.password;
  var user = await userModel.findOne({ email: req.body.email }).populate("contract")
  
//  console.log("user",user )

  if (password === null || user === null) {
    response = false;
    error = "Email ou mot de passe incorrects"
    res.json({ response, error });
  } else if (bcrypt.compareSync(password, user.password)) {
    response = true;
    token = uid2(32)

    var updateToken = await userModel.updateOne({ email: req.body.email }, {token: token})
    res.json({ response, user, token });
  } else if (bcrypt.compareSync(password, user.password) === false) {
   // console.log('password ', password)
   // console.log('user.password ', user.password)
    response = false;
    error = "Email ou mot de passe incorrects"  
    res.json({ response, error });
  } 
  
})



module.exports = router;
