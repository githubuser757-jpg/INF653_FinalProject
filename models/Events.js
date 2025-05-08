const mongoose = requrie('mongoose');
<<<<<<< HEAD
const EventsSchema = new mongoose.Schema({
=======
const EventsSchema = new module.Schema({
>>>>>>> cac34aa822dcbc141001fc7b2505be23661824a1
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    category: {
        type: String,
    },
    venue: {
        type: String,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
    },
    seatCapacity: {
        type: Number,
        required: true,
    },
    bookedSeats: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required: true,
    }
});

module.exports = mongoose.model("Events", EventsSchema);