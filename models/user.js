const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const validateEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};
const validatePhone = (phone) => {
    const re = /\d{10}/;
    return re.test(phone);
}

const UserSchema = new mongoose.Schema({
    fullName: String,
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: "Email address is required",
        validate: [validateEmail, "Please fill a valid email address"],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address",
        ],
    },
    phone: {
        type: Number,
        unique: true,
        unique: true,
        trim: true,
        required: "Mobile Number is required",
        validate: [validatePhone, "Please fill a valid Mobile Number"],
        match: [
            /^ (\+\d{ 1, 2}\s) ?\(?\d{ 3 } \)?[\s.-] ?\d{ 3 } [\s.-] ?\d{ 4 } $/,
            "Please fill a valid mobile number",
        ]
    },
    password: {
        type: String,
        required: "Please enter your password",
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    }
})

UserSchema.pre("save", function (next) {
    const user = this

    if (this.isModified("password") || this.isNew) {
        bcrypt.genSalt(10, function (saltError, salt) {
            if (saltError) {
                return next(saltError)
            } else {
                bcrypt.hash(user.password, salt, function (hashError, hash) {
                    if (hashError) {
                        return next(hashError)
                    }

                    user.password = hash
                    next()
                })
            }
        })
    } else {
        return next()
    }
});

UserSchema.methods.comparePassword = function (password, callback) {
    bcrypt.compare(password, this.password, function (error, isMatch) {
        if (error) {
            return callback(error)
        } else {
            callback(null, isMatch)
        }
    })
}

module.exports = mongoose.model("User", UserSchema)