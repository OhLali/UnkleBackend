var express = require('express');
var router = express.Router();
var mongoose = require("mongoose");
var userModel = require("../models/user")
var contractModel = require("../models/contract")
var optionModel = require("../models/option")
var bcrypt = require("bcrypt");
var uid2 = require("uid2");

router.get('/user-list', async function(req, res, next){
  var getUsers = await userModel.find()
  res.json({ getUsers })
})


/* Création d'un nouvel utilisateur - On considère que seul les admins ont un interface 
pour créer un nouvel utilisateur donc on ne vérifie pas le statut de la personne
connectée pour lui laisser créer l'utilisateur */
router.post('/new-user', async function(req, res, next) {
  var error = "";
  var response = false;
  var password;
  var alreadyExist = await userModel.findOne({
    email: req.body.email,
  });

  if (alreadyExist !== null) {
    error = "Cet e-mail est déjà utilisé";
  } else if (
    req.body.email === null ||
    req.body.userType === null ||
    req.body.userType === undefined
  ) {
    error = "Merci de renseigner tous les champs";
  } else {
    const cost = 10;
    password = uid2(32);
    const hash = bcrypt.hashSync(password, cost);

    var newUser = new userModel({
      token: uid2(32),
      email: req.body.email,
      password: hash,
      userType : req.body.userType,
    })

    var userSaved = await newUser.save();
    response = true;

  } 
  
  res.json({ userSaved, response, error });
});

module.exports = router;
