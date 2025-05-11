const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');

//Route to register new user
router.post('/register', async(req, res)=>{
    try{
        //Extract the data from the request body
        const {name, email, password, role } = req.body;

        //Validate required fields
        if(!name || !email || !password){
            return res.status(400).json({ error: 'Name, email, and password are required.'});
        }

        //Check if a user with the same email already exists
        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({ error: 'User already exists.'});
        }

        //Hash the password before saving it
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        //Create the new User
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'user'
        });

        //Save the user to the database
        await newUser.save();

        //Remove the password from the user response for security
        const userResponse = { name: newUser.name, email: newUser.email, role: newUser.role, _id: newUser._id};

        res.status(201).json({ message: 'User created successfully.', user: userResponse});
    } catch(e){
        console.error('Error during registration:', e);
        res.status(500).json({ error: 'Internal server error while registering user.'});
    }
});

//Route to login user
router.post('/login', async(req, res)=>{
    try{
        const{email, password} = req.body;
        
        //Validate input
        if(!email || !password){
            return res.status(400).json({error: 'Email and password required.'});
        }

        //Look up user by email
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({error: 'User does not exist.'});
        }

        //Compare the incoming password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({error: 'Invalid password.'});
        }        

        //Create the token
        const payload={
            id: user._id,
            email: user.email,
            role: user.role
        };

        //Sign the token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10h'});

        //Return the token to the client
        res.json({token});
    } catch(e){
        console.error('Error during login:', e);
        res.status(500).json({error: 'Server error during login.'});
    }
});

module.exports = router;