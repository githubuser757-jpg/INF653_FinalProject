const mongoose = require('mongoose');

<<<<<<< HEAD
const BookingsSchema = mongoose.Schema({
=======
const BookingsSchema = module.Schema({
>>>>>>> cac34aa822dcbc141001fc7b2505be23661824a1
    user: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "Users",
    },
    event:{
        type: mongoose.Schema.Types.ObjectID,
        ref: "Events",
    },
    quantity:{
        type: Number,
        required: true,
    },
    bookingDate:{
        type: Date,
        default: Date.now,
    },
    qrCode:{
        type: String
    }
});

module.exports = mongoose.model("Bookings", BookingsSchema);