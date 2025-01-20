const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    sUserName: {
        type: String,
        unique: [true, 'Username should be unique!'],
        require: [true, "Username is a required feild!"]
    }, 
    sEmail: {
        type: String,
        unique: [true, "Email should be unique!"],
        require: [true, "Email is required feild!"],
    }, 
    sPassword: {
        type: String,
        require: [true, "Password is required feild!"]
    },
    // encrypting the password
    sSalt: {
        type: String,
        require: [true, "Salt is required feild!"]
    },
    sName: {
        type: String,
        default: "",
    },
    sBio: {
        type: String,
        default: "",
        maxLength: [160, "bio must not be more than 160 characters!"]
    },
    sProfilePic: {
        type: String,
        default: "https://res.cloudinary.com/sumitrana/image/upload/v1718789457/a0cmxigcuphwyudjsror.png",
    },
    sHeaderImg: {
        type: String,
        default: "",
    },
    sRole: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    aFollowing: [
        {
            sUserId: {
                type: mongoose.Schema.ObjectId,
                ref: "user",
                require: [true, "userId is required feild!"]
            }
        }
    ],
    aFollowers: [
        {
            sUserId: {
                type: mongoose.Schema.ObjectId,
                ref: "user",
                require: [true, "userId is required feild!"]
            }
        }
    ],
    eStatus: {
        type: String,
        enum: ["y", "n", "d"], // y=active, n=blocked, d=deleted 
        default: "y",
    },
    bIsUserVerified: {
        type: Boolean,
        default: false,
    },
    // bIsEmailVerified: {
    //     type: Boolean,
    //     default: false,
    // },
    // For bookmarks
    aSavedTweets: [
        {
            sTweetId: {
                type: mongoose.Schema.ObjectId,
                ref: "tweet",
                required: true
            }
        }
    ],
    sResetPasswordToken: String,
    sResetPasswordExpiresIn: Number,
    // sVerifyEamilToken: String,
    // sVerifyEamilTokenExpiresIn: String
}, {
    timestamps: true
})

module.exports = mongoose.model("user", userSchema)