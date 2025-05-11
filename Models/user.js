const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {type: String},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    admin: {type: Boolean, default: false}
})

const User = mongoose.model("User", userSchema);

module.exports = User;

