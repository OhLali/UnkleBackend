var express = require('express');
var router = express.Router()

var mongoose = require("mongoose");
var userModel = require("../models/user")
var contractModel = require("../models/contract")
var optionModel = require("../models/option")
var bcrypt = require("bcrypt");
var uid2 = require("uid2");


/* L'administrateur veut afficher tous les users */
router.get("/all-users/:token", async function(req,res,next){
  let error = "";
  let response = false;
  let allContracts = {};
  let user = await userModel.findOne({token : req.body.token});
console.log(user)
if (user === null){ 
  error = "Nous avons rencontré un problème, contactez le support";
  response = false;
  res.json({ response, error });
} else if (user.userType === "Admin"){
    allUsers = await userModel.find()
    response = true;

    res.json({ response, allUsers });  

  } else if (user.userType === "Client") {

    error = "Vous n'êtes pas habilité à réaliser cette action, contactez le support";
    res.json({ response, error }); 

  } else {
    
    error = "Nous avons rencontré un problème, contactez le support";
    response = false;

    res.json({ response, error });
  }
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
    req.body.email === "" ||
    req.body.userType === ""
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
 
  res.json({ userSaved, response, error, password });
});


/* L'administrateur veut supprimer un user ou le Client veut supprimer son compte */
router.delete('/delete-user', async function(req, res, next){
  let error = "";
  let response = false;
  let userToDelete;
  let user = await userModel.findOne({token : req.body.token})

  if (user.userType === "Admin"){
    userToDelete = await userModel.deleteOne({email : req.body.emailUserToDelete})
    

    response = true

    res.json({response})

  } else if (user.userType === "Client"){
    if (user.email === req.body.emailUserToDelete){
      userToDelete = await userModel.deleteOne({email : req.body.emailUserToDelete})

      response = true

    res.json({response})
    } else {
      error = "Vous n'êtes pas habilité à réaliser cette action, contactez le support"
      response = false

    res.json({response, error})
    }

  }

})


module.exports = router;