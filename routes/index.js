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
 
  res.json({ userSaved, response, error, password });
});

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
    allContracts = await contractModel.find().populate("option").populate("user")
    response = true;

    res.json({ response, allContracts }); 
  } else if (user.userType === "Client") {

    error = "Vous n'êtes pas habilité à réaliser cette action, contactez le support";
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

    error = "Vous n'êtes pas habilité à réaliser cette action, contactez le support";
    res.json({ response, error }); 

  } else {
    
    error = "Nous avons rencontré un problème, contactez le support";
    response = false;

    res.json({ response, error });
  }
})

/* L'administrateur veut afficher toutes les options */
router.get("/all-options/:token", async function(req,res,next){
  let error = "";
  let response = false;
  let allOptions = {};
  let user = await userModel.findOne({token : req.body.token});
  console.log(user)
  if (user === null){ 
  error = "Nous avons rencontré un problème, contactez le support null";
  response = false;
  res.json({ response, error });
} else if (user.userType === "Admin"){
    allOptions = await optionModel.find()
    response = true;

    res.json({ response, allOptions });  

  } else if (user.userType === "Client") {

    error = "Vous n'êtes pas habilité à réaliser cette action, contactez le support";
    res.json({ response, error }); 

  } else {
    
    error = "Nous avons rencontré un problème, contactez le support";
    response = false;

    res.json({ response, error });
  }
})


/* L'administrateur veut créer une nouvelle option */

router.post("/option-creation/:token", async function(req,res,next){
  let error = "";
  let response = false;
 
  let user = await userModel.findOne({token : req.body.token});
console.log(user)

if (user === null){ 
  error = "Nous avons rencontré un problème, contactez le support";
  response = false;
  res.json({ response, error });
} else if (user.userType === "Admin"){
    let newOption = new optionModel({
      identifiant : req.body.identifiant,
      description : req.body.description
    })
    let optionSaved = await newOption.save();

    response = true

    res.json({ response, optionSaved }); 
  } else if (user.userType === "Client") {

    error = "Vous n'êtes pas habilité à réaliser cette action, contactez le support";
    res.json({ response, error }); 

  } else {
    
    error = "Nous avons rencontré un problème, contactez le support";
    response = false;

    res.json({ response, error });
  }
}) 

/* L'administrateur veut créer un nouveau contrat */
  /* On considère que l'admin a précédement fait appel aux routes all-users et all-option afin d'afficher 
  la liste entière des utilisateurs et des options pour les afficher et sélectionner dans ces listes les clients et options
  à ajouter au contrat. On a donc déjà les ID des users et des options qui sont renvoyés ici sous forme d'une chaine de caratères
  séparés par des virgules */
  
router.post("/new-contract", async function(req, res, next){
  let error = "";
  let response = false;
  let listOfClientsAttached = req.body.clientsAttached.split(',')
  let tabListOfClientsAttached = [];
  let listOfOptionsAttached = req.body.optionsAttached.split(',')
  let tabListOfOptionsAttached = [];
  let status;
  let todayDate = new Date();
 
  let contractDate = new Date(req.body.startingDate)

  let endingDate = contractDate;
  endingDate.setFullYear(endingDate.getFullYear() + 1);

    console.log("1 an",endingDate)
  let user = await userModel.findOne({token : req.body.token})

  if (contractDate == todayDate) {
    status = "active";
  } else if (contractDate > todayDate){
    status = "pending";
  } else if (contractDate < todayDate){
    status = "erreur de date"
  }
  console.log("status ",status)

  if (user.userType === "Admin" ){ // je vérifie bien que mon user est un Admin pour plus de sécurité

    if (status === "erreur de date"){
      // si la date est invalide, je renvoie directement l'information sans enregistrer en bdd
      res.json({ status });
    } else {
        // je boucle pour mettre tous mes id users dans un tableau
        for (let i=0 ; i<listOfClientsAttached.length; i++){
          tabListOfClientsAttached.push(listOfClientsAttached[i])
        }

        // je boucle pour mettre tous mes id d'options dans un tableau
        for (let j=0 ; j<listOfOptionsAttached.length; j++){
          tabListOfOptionsAttached.push(listOfOptionsAttached[j])
        }
      console.log('tableaux ',tabListOfClientsAttached, tabListOfOptionsAttached)

      // Je crée le nouveau contrat en BDD
        let newContract = new contractModel({
            contractNumber: "unk_"+uid2(10),
            startingDate: req.body.startingDate,
            user: tabListOfClientsAttached,
            option: tabListOfOptionsAttached,
            status : status,
            endingDate : endingDate
      })

      let contractSaved = await newContract.save();
      response = true;

      // j'enregistre la clef étrangère du contrat dans les clients liés au contrat

      for (let i=0; i<tabListOfClientsAttached.length; i++){
        let user = await userModel.findOne({_id : tabListOfClientsAttached[i]})
        
        user.contract.push(contractSaved._id)
        var idContractSaved = await user.save()
      }


      res.json({ response,contractSaved }); 
      }

  } else if (user.userType === "Client") {
    error = "Vous n'êtes pas habilité à réaliser cette action, contactez le support";
    res.json({ response, error });
  } else {
    error = "Nous avons rencontré un problème, contactez le support";
    response = false;

    res.json({ response, error, status });
  }  

})

/* Le client veut afficher tous ses contrats et leurs options */

router.get("/my-contracts/:token", async function(req, res, next){
  let error = "";
  let response = false;
  let mycontracts;
  let status;
  let todayDate = new Date();

  let user = await userModel.findOne({token : req.body.token}).populate('contract')

  /* ne sachant pas mettre à jour une bdd entièrement pour mettre à jour tous les status d'un coup
  et n'ayant pas assez de temps impartis pour creuser cette partie, j'ai choisi de tout de même faire une mise 
  à jour quand le user cherche à afficher ses contrats. */
  if (user.userType === "Client"){
    for (let i=0 ; i< user.contract.length ; i++){
      mycontracts = await contractModel.findOne({_id : user.contract[i]}).populate('option')

      if (mycontracts.startingDate <= todayDate && mycontracts.endingDate <= todayDate && mycontracts.status ==! "active"){
          status = "active"
          let majStatus = await contractModel.updateOne({_id : mycontracts._id}, {status : status})
          let majStatusSaved = await majStatus.save();

      } else if (todayDate >= mycontracts.endingDate && status ==! "finished"){
        status = "finished"
          let majStatus = await contractModel.updateOne({_id : mycontracts._id}, {status : status})
          let majStatusSaved = await majStatus.save();
      } else if ( mycontracts.startingDate >=todayDate && status ==! "pending"){
        status = "pending"
          let majStatus = await contractModel.updateOne({_id : mycontracts._id}, {status : status})
          let majStatusSaved = await majStatus.save();
      }
      mycontracts = await contractModel.findOne({_id : user.contract[i]}).populate('option')

    }

    res.json({user, mycontracts})
  } else {
    error = "Erreur, mauvaise route"
    res.json({error})
  }

})

router.put('/terminate-contract', async function(req, res, next){
  let error = "";
  let response = false;

  let idContractToTerminate = req.body.idContractToTerminate;
  let status;
  let todayDate = new Date();
  
  let endingDate = req.body.endingDate

  let user = await userModel.findOne({token : req.body.token}).populate('contract')
  let contractToTerminate = await contractModel.findOne({_id : idContractToTerminate})

  console.log(" todayDate",todayDate, contractToTerminate.startingDate)

  if (todayDate <= endingDate && todayDate >= contractToTerminate.startingDate){
    status = "active"
  } else if (todayDate >= endingDate){
    status = "finished"
  } else if (todayDate < contractToTerminate.startingDate && endingDate > contractToTerminate.startingDate){
    status = "pending"
  } else {
    status = "else"
  }

  if (user.userType === "Admin"){
    
    contractToTerminate = await contractModel.updateOne({_id : idContractToTerminate},{endingDate : endingDate , status : status})
    response = true

    res.json({response, status})
  } else if (user.userType === "Client"){
      for (let i=0 ; i<user.contract.lenght ; i++){
        console.log("i dans la boucle", i)
        if (user.contract[i]._id === idContractToTerminate) {
          contractToTerminate = await contractModel.updateOne({_id : idContractToTerminate},{endingDate : endingDate , status : status})
         response = true 
        }
        res.json({response})
      }
  } else {
    error = "Vous n'êtes pas habilité pour réaliser cette action contactez le support"
    response = false
    res.json({response, error})
  }
})



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
