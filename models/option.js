var mongoose = require('mongoose');


var OptionSchema = mongoose.Schema({
    identifiant : String,
    description : String
})

module.exports = mongoose.model('options', OptionSchema)
