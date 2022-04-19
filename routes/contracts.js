var express = require('express');
var router = express.Router()
var mongoose = require("mongoose");

var userModel = require("../models/user")
var contractModel = require("../models/contract")
var optionModel = require("../models/option")
var uid2 = require("uid2");

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

  /* route de résiliation d'un contrat */

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
  
    // mettre à jour le status
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
          // je boucle pour que l'on vérifie bien que le client est bien sur le contrat qu'il demande à résilier
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
  

module.exports = router