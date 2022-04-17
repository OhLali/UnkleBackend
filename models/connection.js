var mongoose = require('mongoose');

const dotenv = require("dotenv");
dotenv.config();


var options = {
 connectTimeoutMS: 5000,
 useNewUrlParser: true,
 useUnifiedTopology : true
}

mongoose.connect(`mongodb+srv://${process.env.identifiant}:${process.env.mdp}@cluster0.ky86x.mongodb.net/UnkleBackend?retryWrites=true&w=majority`, options,        
 function(err) {
   console.log(err);
 }
);