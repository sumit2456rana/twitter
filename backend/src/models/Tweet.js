const mongoose = require('mongoose');

const { minContentLen, maxContentLen, minCommentLen, maxCommentLen } = require('../../constants')

const tweetSchema = mongoose.Schema({
    sUserName: {
        type: String,
        require: [true, "user name is required feild for tweet!"],
    },
    sContent: {
        type: String,
        require: [true, "content is a required feild for a tweet!"],
        minLength: [minContentLen, `a minimum of ${minContentLen} chars is required for the tweet!`],
        maxLength: [maxContentLen, `no more than ${maxContentLen} chars are allowed for the tweet!`],
    },
    eContentReach: {
        type: String,
        enum: ['everyone', 'followers'],
        default: "everyone"
    },
    aTweetImages: [
        {
            type: String
        }
    ],
    aLikes: [
        {
            sUserId: {
                type: mongoose.Schema.ObjectId,
                ref: "user",
                require: [true, "user id is required feild for likes!"],
            }
        }
    ],
    aRetweeted: [
        {
            sUserId: {
                type: mongoose.Schema.ObjectId,
                ref: "user",
                require: [true, "user id is required feild for retweets!"]
            }
        }
    ],
    aComments: [
        {
            sUserId: {
                type: mongoose.Schema.ObjectId,
                ref: "user",
                require: [true, "user id is reauired feild for comments!"],
            },
            sCommentContent: {
                type: String,
                require: [true, "comment content is required for adding a comment!"],
                minLength: [minCommentLen, `comment must be atleast of ${minCommentLen} chars!`],
                maxLength: [maxCommentLen, `comment must not be more than ${maxCommentLen} chars!`]
            }
        }
    ],
    eStatus: {
        type: String,
        enum: ["y", "n", "d"], // y = active, n = blocked , d = deleted
        default: "y"
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('tweet', tweetSchema);