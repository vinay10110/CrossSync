const express=require('express');
const router=express.Router();
const User =require('../models/User')
router.post('/getuser',async(req,res)=>{
    const {email}=req.body;
   console.log(email);
    try {
      const document=await User.find({email});
    
      return res.status(200).json(document)
    } catch (error) {
      return res.status(500).json({message:"Internal server error"});
    }
})
router.post('/login', async (req, res) => {
  const { fullUser,userRole} = req.body;
  console.log(fullUser);
  try {
    const user = new User({
      email: fullUser.email,
      role: userRole,
      photourl:fullUser.identities[0]?.identity_data?.avatar_url
    });

   
    const savedUser = await user.save();

    res.status(201).json(savedUser); 
  } catch (error) {
    console.error('Error in Google Auth route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})
router.put('/updateuser/:id',async(req,res)=>{
const {id}=req.params;
const updateUser=req.body;
try {
  const userDoc=await User.findByIdAndUpdate(id,updateUser,{new:true});
  return res.status(200).json(userDoc);
} catch (error) {
  return res.status(500).json({message:"Internal server error"});
}
})
router.delete('/deleteuser',async(req,res)=>{
    const {id}=req.body;
   try {
    const userDoc=await User.findByIdAndDelete(id);
    if(userDoc){
      return res.status(200);
    }
   } catch (error) {
    return res.status(500).json({message:"Internal server error"})
   }
})
module.exports =router;

  
  
  