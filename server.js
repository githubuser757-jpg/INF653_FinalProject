require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

//Add middleware to parse JSON bodies
app.use(express.json());

(async ()=>{
  const { eventsRouter, connectDB} = require('./api/events');
  const authRouter = require('./api/auth');
  app.use('/api', eventsRouter);
  app.use('/api/auth', authRouter);
  
    try{
        await connectDB();
        console.log('Database connected successfully.');
    } catch(e){
        console.error('Database connection error: ', e);
    }

//Serve the static index file
app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//Handle 404 errors
app.use((req, res)=>{
    res.status(404).send('404 Not Found');
});

//Start the server
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});
})();
