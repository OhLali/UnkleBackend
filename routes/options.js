var express = require('express');
var router = express.Router()
var mongoose = require("mongoose");

var userModel = require("../models/user")
var contractModel = require("../models/contract")
var optionModel = require("../models/option")
var uid2 = require("uid2");


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
  
  

module.exports = router