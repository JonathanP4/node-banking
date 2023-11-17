const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    account: {
        balance: { type: Number, required: true },
        transactions: [
            {
                to: String,
                date: String,
                time: String,
                value: Number,
            },
        ],
        profile_picture: String,
        username: String,
    },
});

exports.User = mongoose.model("User", userSchema);
