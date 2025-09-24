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
  const { fullUser, userRole } = req.body;
  console.log('Login request:', { fullUser, userRole });
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: fullUser.email },
        { clerkId: fullUser.id }
      ]
    });

    if (existingUser) {
      // User already exists, return the existing user
      return res.status(200).json(existingUser);
    }

    // Create new user
    const user = new User({
      email: fullUser.email,
      clerkId: fullUser.id, // Add the required clerkId field
      role: userRole,
      firstName: fullUser.firstName,
      lastName: fullUser.lastName,
      imageUrl: fullUser.imageUrl
    });

    const savedUser = await user.save();
    console.log('New user created:', savedUser);

    res.status(201).json(savedUser); 
  } catch (error) {
    console.error('Error in login route:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error', details: error.message });
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
      return res.status(200).json({message:"User deleted successfully"});
    }
   } catch (error) {
    return res.status(500).json({message:"Internal server error"})
   }
})

module.exports =router;

  
  
  