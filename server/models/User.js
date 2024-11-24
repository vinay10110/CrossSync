const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username:String,
  email: {
    type: String,
    unique: true,
    sparse: true, 
  },
 photourl:String,
 country:{
  type:String,
  default:'india'
 },
  role: {
    type: String,
    
  },
}, { timestamps: true }); 

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
