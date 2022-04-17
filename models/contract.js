var mongoose = require('mongoose');

var ContractSchema = mongoose.Schema({
    contractNumber : String,
    status : String,
    startingDate : Date,
    endingDate : Date,
    user : { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    option : { type: mongoose.Schema.Types.ObjectId, ref: 'options' },
})

module.exports = mongoose.model('contracts', ContractSchema)

