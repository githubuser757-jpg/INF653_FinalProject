const mongoose = require('mongoose');

const connectDB = async() =>{
    try{
        await mongoose.connet(process.env.DATABASE_URL,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true
        })
    } catch(e)
    {
        console.log(e);
    }
}

module.exports = connectDB;