const mongoose = require('mongoose');

const BookingsSchema = mongoose.Schema({
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