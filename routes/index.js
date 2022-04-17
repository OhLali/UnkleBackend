var express = require('express');
var router = express.Router();
var mongoose = require("mongoose");
var userModel = require("../models/user")
var contractModel = require("../models/contract")
var optionModel = require("../models/option")
var bcrypt = require("bcrypt");
var uid2 = require("uid2");
const { findOne } = require('../models/user');

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
  //console.log(password)
  res.json({ userSaved, response, error, password });
});

/* Connexion à l'espace */

router.post('/signIn', async function(req, res, next){
  var error = "";
  var response = false;
  var token;
  var password = req.body.password;
  var user = await userModel.findOne({ email: req.body.email }).populate("contract");
  
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
  /* L'administrateur veut afficher tous les contrats */
router.get("/all-contracts/:token", async function(req,res,next){
  let error = "";
  let response = false;
  let allContracts = {};
  let user = await userModel.findOne({token : req.body.token})

  if (user === null){ 
    error = "Nous avons rencontré un problème, contactez le support";
    response = false;
    res.json({ response, error });
 } else if (user.userType === "Admin"){
    allContracts = await contractModel.find()
    response = true;

    res.json({ response, allContracts }); 
  } else if (user.userType === "Client") {

    error = "Vous n'êtes pas abilité à réaliser cette action, contactez le support";
    res.json({ response, error }); 

  } else {

    error = "Nous avons rencontré un problème, contactez le support";
    response = false;

    res.json({ response, error });
  }
})
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

    error = "Vous n'êtes pas abilité à réaliser cette action, contactez le support";
    res.json({ response, error }); 

  } else {
    
    error = "Nous avons rencontré un problème, contactez le support";
    response = false;

    res.json({ response, error });
  }
})

router.post("/new-contract", async function(req, res, next){
  let error = "";
  let response = false;
  let listOfClientsAttached = req.body.clientsAttached // il s'agit d'un tableau d'email des clients qui sont liés au contrat
  let tabListOfClientsAttached = [];
  let user = await userModel.findOne({token : req.body.token})

  if (user.userType === "Admin"){

    for (let i=0 ; i<listOfClientsAttached.length; i++){
      console.log(listOfClientsAttached[i])
      // let client = await userModel.findOne({email: listOfClientsAttached[i]})
      // tabListOfClientsAttached.push(client._id)

    }
  console.log(tabListOfClientsAttached)
  //   let newContract = new contractModel({
  //   contractNumber: "unk_",
  //   startingDate: req.body.startingDate,
  //   user: tabListOfClientsAttached,
  //   option:,
  // })

 // let contractSaved = await newContract.save();


   response = true;

   res.json({ response/*,contractSaved*/ });

  } else if (user.userType === "Client") {
    error = "Vous n'êtes pas abilité à réaliser cette action, contactez le support";
    res.json({ response, error });
  } else {
    error = "Nous avons rencontré un problème, contactez le support";
    response = false;

    res.json({ response, error });
  }
  
  

})

module.exports = router;
