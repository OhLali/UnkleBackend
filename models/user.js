var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
    userType : String,
    email : String,
    password : String,
    token : String,
    contract : [{ type: mongoose.Schema.Types.ObjectId, ref: 'contracts' }],
})

module.exports = mongoose.model('users', UserSchema)
