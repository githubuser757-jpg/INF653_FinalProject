const mongoose = require('mongoose');
const express = require('express');
const eventsRouter = express.Router();
const Event = require('../models/Events');
const Booking = require('../models/Bookings');
const verifyToken = require('../middleware/verifyToken');

//Route to get all events
eventsRouter.get('/events', async (req, res)=>{
    try{
        const {category, date} = req.query;
        let filter = {};

        //If at least one category exists, add it to filters
        if(category){
            filter.category = category;
        }

        if(date){
            const startDate = new Date(date);
            const endDate = new Date(date);

            //Set the end date to the very last millisecond of that day
            endDate.setHours(23, 59, 59, 999);

            //Filter events that happen on that day
            filter.date = { $gte: startDate, $lte: endDate};
        }

        //Retrieve all events from the "Events" collection
        const events = await Event.find(filter);
        res.status(200).json({events});
    } catch(e){
        console.error('Error fetching events:', e);
        res.status(500).json({ error: 'Error fetching events'});
    }
});

//Route to retrieve event by id
eventsRouter.get('/events/:id', async (req, res)=>{
    try{
        const {id} = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ error: 'Invalid event id'});
        }

        const event = await Event.findById(id);

        if(!event){
            return res.status(404).json({ error: 'Event Not Found'});
        }

        res.status(200).json({event});
    } catch(e){
        console.error('Error retrieving event:', e);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

//Create new Bookings
eventsRouter.post('/bookings', verifyToken, async(req, res)=>{
    try{
        //Get the logged-in user's ID from the JWT token
        const userId = req.user.id;

        //Check if user is a user
        if(req.user.role !== "user"){
            return res.status(403).json({error: "Access Denied. Users only."});
        }

        const { eventId, quantity } = req.body;

        if(!eventId || !quantity){
            return res.status(401).json({error: 'EventId and quantity are required.'});
        }

        //Find the event by ID
        const event = await Event.findById(eventId);
        if(!event){
            return res.status(404).json({error: 'Event not found.'});
        }

        //Calculate the available seats
        const availableSeats = event.seatCapacity - event.bookedSeats;
        if(availableSeats < quantity){
            return res.status(400).json({error: 'Not enough seats available for booking.'});
        }

        //Create a new booking document for this user and event
        const newBooking = new Booking({
            user: userId,
            event: eventId,
            quantity,
            bookingDate: new Date()
        });
        await newBooking.save();

        //Update the event's bookedSeats
        event.bookedSeats += quantity;
        await event.save();

        //Respond the success of the new Booking
        res.status(201).json({message: 'Booking successful.', booking: newBooking});
    } catch(e){
        console.error('Error creating new Booking:', e);
        res.status(500).json({error: 'Server side error creating new booking.'});
    }
});

//Route to get all bookings for the logged in user
eventsRouter.get('/bookings', verifyToken, async(req, res)=>{
    try{
        const bookings = await Booking.find({ user: req.user.id });
        return res.status(200).json({bookings});
    } catch(e){
        console.error('Error retrieving all bookings: ', e);
        res.status(500).json({error: 'Server side error retrieving bookings.'});
    }
});

//Route to retrieve booking by id
eventsRouter.get('/bookings/:id', verifyToken, async (req, res)=>{
    try{
        if(req.user.role !== "user"){
            return res.status(403).json('Access Denied. Users Only.');
        }

        const {id} = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({ error: 'Invalid event id'});
        }

        const booking = await Booking.findById(id);

        if(!booking){
            return res.status(404).json({ error: 'Booking Not Found'});
        }

        res.status(200).json({booking});
    } catch(e){
        console.error('Error retrieving event:', e);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

//Route to create new event
eventsRouter.post('/', verifyToken, async(req, res)=>{
    try{
        //Check if user is an admin
        if(req.user.role !== 'admin'){
            return res.status(403).json({error: 'Access Denied. Admins only.'});
        }

        //Destructure and validate the request body.
        const {title, description, category, venue, date, time, seatCapacity, price } = req.body;
        if(!title || !description || !date || !seatCapacity || !price){
            return res.status(400).json({error: 'Missing required fields: title, description, date, or seatCapacity not defined.'});
        }

        //Create a new event
        const newEvent = new Event({
            title,
            description,
            category,
            venue,
            date: new Date(date),
            time,
            seatCapacity,
            bookedSeats: 0, //Default to zero booked seats for new event
            price
        });

        //Save the event to the database
        await newEvent.save();

        //Respond with the created event
        res.status(201).json({message: 'Event created successfully.', event: newEvent});
    } catch(e){
        console.error('Error creating new event: ', e);
        res.status(500).json({error: 'Internal error creating new event.'});
    }
});

//Route to update an event
eventsRouter.put('/events/:id', verifyToken, async(req, res)=>{
    try{
        if(req.user.role !== 'admin'){
            return res.status(403).json({error: 'Access Denied. Admin Only.'});
        }

        const { id } = req.params;

        //Validate id is a MongoDB ObjectId
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({error: 'Invalid Id'});
        }

        //Find event
        const event = await Event.findById(id);
        if(!event){
            return res.status(404).json({error: 'Unable to find event.'});
        }

        //Destructure the properties to update
        const {title, description, category, venue, date, seatCapacity, bookedSeats = event.bookedSeats, price } = req.body;

        if(seatCapacity !== undefined && seatCapacity < event.bookedSeats){
            return res.status(400).json({error: 'seatCapacity cannot be reduced to be lower than bookedSeats.'});
        }

        //Update event fields
        event.title = title || event.title;
        event.description = description || event.description;
        event.category = category || event.category;
        event.venue = venue || event.venue;
        event.date = date ? new Date(date) : event.date;
        event.seatCapacity = seatCapacity || event.seatCapacity;
        event.bookedSeats = bookedSeats;
        event.price = price || event.price;

        //Save updated event
        await event.save();

        res.status(200).json({"message": 'Event updated successfully.', event});
    } catch(e){
        console.error('Error updating event: ', e);
        res.status(500).json({error: 'Internal error updating event.'});
    }
});

//Route to delete an event
eventsRouter.delete('/events/:id', verifyToken, async(req, res)=>{
    try{
        //Verify user is an admin
        if(req.user.role !== "admin"){
            return res.status(403).json({error: "Access Denied. Admin Only."});
        }

        const { id } = req.params;

        //Validate id is a valid MongoDB ObjectId
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({error: "Invalid Event Id"});
        }

        //Find the event
        const event = await Event.findById(id);
        if(!event){
            return res.status(404).json({error: "Event Not Found"});
        }

        const bookings = await Booking.find({ event: id });
        if(bookings.length > 0){
            return res.status(400).json({ error: 'Cannot delete event with existing bookings. Please delete bookings first before deletion.'});
        }

        //Delete Event
        await Event.deleteOne({ _id: id });

        return res.status(200).json({ message: 'Event deleted successfully.' });
    } catch(e){
        console.error('Error deleting event:', e);
        res.status(500).json({error: 'Internal server error deleting event.'});
    }
});

//Function to connect to MongoDB
const connectDB = async() =>{
    try{
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected to MongoDB');
    } catch(e){
        console.log(e);
    }
}

module.exports = {
    eventsRouter,
    connectDB
};