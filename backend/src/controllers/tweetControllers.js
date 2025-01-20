const User = require('../models/User');
const { mongify } = require('../utils/lib/mongodb');
const Tweet = require('../models/Tweet');
const { responseHandler, uploadOnCloudinary } = require('../utils/util')

const addTweet = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(400, "User is not authenticated!", res);

        if (!req.body.content)
            return responseHandler(404, "content is required feild for adding the tweet!", res)

        const user = await User.findOne({ _id: mongify(req.userId) });

        if (!user)
            return responseHandler(403, "Access Denied, user is invalid!", res);

        let tweetObj = {
            sUserName: user.sUserName,
            sContent: req.body.content
        }

        if (req.body.contentReach === 'followers') {
            tweetObj.eContentReach = req.body.contentReach;
        }
        if (req.files) {
            const imageUploadPromises = req.files?.map(async (e) => {
                return uploadOnCloudinary(e.path);
            })
            const images = await Promise.all(imageUploadPromises);
            const imageUrl = images.map(e => e.url);
            if (imageUrl.length > 0)
                tweetObj.aTweetImages = imageUrl
        }
        const resp = await Tweet.create(tweetObj);
        responseHandler(201, "Tweet created successfully!", res);

    } catch (error) {
        console.log(error);
        responseHandler(501, 'Something went wrong, please try again later!', res);
    }
}

const deleteTweet = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(400, "User is not authenticated!", res);

        if (!req.body.tweetId)
            return responseHandler(404, "tweetId is required feild for removing the tweet!", res)

        const user = await User.findOne({ _id: mongify(req.userId) });

        if (!user)
            return responseHandler(403, "Access Denied, user is invalid or not found!", res);

        const tweet = await Tweet.findOne({ _id: mongify(req.body.tweetId), eStatus: 'y', sUserName: user.sUserName });

        if (!tweet)
            return responseHandler(404, "An active tweet with the given tweetId and user info not found!", res);

        await Tweet.deleteOne({ _id: mongify(req.body.tweetId), sUserName: user.sUserName });
        res.status(200).json();
    } catch (error) {
        console.log(error);
        responseHandler(501, 'Something went wrong, please try again later!', res);
    }
}

const likeTweet = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(400, "User is not authenticated!", res);

        if (!req.body.tweetId)
            return responseHandler(404, "tweetId is a required feild for liking the tweet!", res);

        let tweet = await Tweet.findOne({ _id: mongify(req.body.tweetId), eStatus: 'y' });

        if (!tweet)
            return responseHandler(404, "Tweet with given tweet id not found!", res);

        const checkIfAlreadyLiked = [
            // Finding the tweet with the given tweet id
            {
                $match: {
                    _id: mongify(req.body.tweetId),
                    eStatus: 'y'
                }
            },
            // destructuring array of likes
            {
                $unwind: {
                    path: "$aLikes"
                }
            },
            // checking if user is already exists
            {
                $match: {
                    "aLikes.sUserId": mongify(req.userId)
                }
            }
        ]

        const rs = await Tweet.aggregate(checkIfAlreadyLiked);

        // if there is someting in respone then the user is already liked the tweet
        if (rs.length > 0)
            return responseHandler(400, "Tweet is already liked by the user!", res);

        tweet.aLikes.push({
            sUserId: req.userId
        })

        // saving the tweet in mongodb
        await tweet.save();

        return responseHandler(200, "Tweet liked successfully!", res);
    } catch (error) {
        console.log(error);
        responseHandler(501, 'Something went wrong, please try again later!', res);
    }
}

const dislikeTweet = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        if (!req.body.tweetId)
            return responseHandler(400, "tweetId is a required field for unliking the tweet!", res);

        const tweet = await Tweet.findOne({ _id: mongify(req.body.tweetId), eStatus: "y" });
        if (!tweet)
            return responseHandler(404, "Tweet with given tweet id not found!", res);

        const checkIfAlreadyLiked = [
            {
                $match: {
                    _id: mongify(req.body.tweetId),
                    eStatus: "y"
                }
            },
            {
                $unwind: {
                    path: "$aLikes"
                }
            },
            {
                $match: {
                    "aLikes.sUserId": mongify(req.userId)
                }
            }
        ];

        const rs = await Tweet.aggregate(checkIfAlreadyLiked);
        if (rs.length === 0)
            return responseHandler(400, "The tweet has not been liked by the user!", res);

        const likeToFind = rs[0].aLikes;

        const idx = tweet.aLikes.findIndex(like =>
            like.sUserId.toString() === likeToFind.sUserId.toString()
        );

        if (idx === -1)
            return responseHandler(404, "Like not found in the tweet's likes!", res);

        tweet.aLikes.splice(idx, 1);
        await tweet.save();

        res.status(200).json({
            message: "Tweet unliked successfully!",
        });
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const addRetweet = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        if (!req.body.tweetId)
            return responseHandler(404, "tweetId is required feild for retweeting the tweet!", res);

        const tweet = await Tweet.findOne({ _id: mongify(req.body.tweetId), eStatus: "y" });
        if (!tweet)
            return responseHandler(404, "Tweet with given tweet id not found!", res);

        const checkIfAlreadyRetweeted = [
            {
                $match: {
                    _id: mongify(req.body.tweetId),
                    eStatus: "y"
                }
            },
            {
                $unwind: {
                    path: "$aRetweeted"
                }
            },
            {
                $match: {
                    "aRetweeted.sUserId": mongify(req.userId)
                }
            }
        ];

        const rs = await Tweet.aggregate(checkIfAlreadyRetweeted);
        if (rs.length > 0)
            return responseHandler(400, "The tweet is already retweeted by the user!", res);

        tweet.aRetweeted.push({
            sUserId: req.userId
        })
        await tweet.save();
        res.status(200).json({
            message: "Tweet retweeted successfully!",
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const deleteRetweet = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        if (!req.body.tweetId)
            return responseHandler(400, "tweetId is a required field for removing retweet the tweet!", res);

        const tweet = await Tweet.findOne({ _id: mongify(req.body.tweetId), eStatus: "y" });
        if (!tweet)
            return responseHandler(404, "Tweet with given tweet id not found!", res);

        const checkIfAlreadyRetweeted = [
            {
                $match: {
                    _id: mongify(req.body.tweetId),
                    eStatus: "y"
                }
            },
            {
                $unwind: {
                    path: "$aRetweeted"
                }
            },
            {
                $match: {
                    "aRetweeted.sUserId": mongify(req.userId),
                }
            }
        ];

        const rs = await Tweet.aggregate(checkIfAlreadyRetweeted);
        if (rs.length === 0)
            return responseHandler(400, "The tweet has not been retweeted by the user!", res);

        const retweetToFind = rs[0].aRetweeted;

        const idx = tweet.aRetweeted.findIndex(retweet =>
            retweet.sUserId.toString() === retweetToFind.sUserId.toString()
        );

        if (idx === -1)
            return responseHandler(404, "Retweet not found in the tweet's retweets!", res);

        tweet.aRetweeted.splice(idx, 1);
        await tweet.save();

        res.status(200).json({
            message: "Retweet by the user for the given tweet is removed successfully!",
        });
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const addComment = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        if (!req.body.tweetId)
            return responseHandler(400, "tweetId is a required feild!", res);
        if (!req.body.commentContent)
            return responseHandler(400, "comment content is required feild!", res);

        const tweet = await Tweet.findOne({ _id: mongify(req.body.tweetId), eStatus: "y" });

        if (!tweet)
            return responseHandler(404, "Tweet with given tweet id is not found!", res);

        tweet.aComments.push({
            sUserId: req.userId,
            sCommentContent: req.body.commentContent
        })
        await tweet.save();
        responseHandler(200, "Comment on the given tweet was added successfully!", res);
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const deleteComment = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        if (!req.body.tweetId)
            return responseHandler(400, "tweetId is a required field!", res);
        if (!req.body.commentId)
            return responseHandler(400, "commentId is a required field!", res);

        const tweet = await Tweet.findOne({ _id: mongify(req.body.tweetId), eStatus: 'y' });
        if (!tweet)
            return responseHandler(404, "Tweet with given tweet id is not found!", res);

        const checkIfAlreadyComment = [
            {
                $match: {
                    _id: mongify(req.body.tweetId),
                    eStatus: "y"
                }
            },
            {
                $unwind: {
                    path: '$aComments'
                }
            },
            {
                $match: {
                    "aComments._id": mongify(req.body.commentId),
                    "aComments.sUserId": mongify(req.userId)
                }
            }
        ];

        const rs = await Tweet.aggregate(checkIfAlreadyComment);

        if (rs.length === 0)
            return responseHandler(404, "comment with the given commentId and tweetId not found!", res);

        const commentToFind = rs[0].aComments;

        const idx = tweet.aComments.findIndex(comment =>
            comment._id.toString() === commentToFind._id.toString() &&
            comment.sUserId.toString() === commentToFind.sUserId.toString()
        );
        if (idx === -1)
            return responseHandler(404, "comment not found in the tweet's comments!", res);

        tweet.aComments.splice(idx, 1);
        await tweet.save();
        responseHandler(200, "comment with the given commentId and tweetId was deleted successfully!", res);
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const getAllTweets = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        const user = await User.findOne({ _id: mongify(req.userId) });

        if (!user)
            return responseHandler(403, "Access Denied, user is invalid!", res);

        // Extract the list of user IDs the logged-in user is following
        const followingIds = user.aFollowing.map(follow => follow.sUserId);

        // Find the usernames of the followed users
        const followingUsers = await User.find({ _id: { $in: followingIds } }, 'sUserName');
        const followingUsernames = followingUsers.map(user => user.sUserName);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Find all tweets visible to everyone and tweets from the followed users
        const allTweets = await Tweet.find({
            eStatus: "y",
            $or: [
                { eContentReach: "everyone" },
                { sUserName: { $in: followingUsernames } }
            ]
        })
            .skip(skip)
            .limit(limit);

        const totalTweets = await Tweet.countDocuments({
            eStatus: "y",
            $or: [
                { eContentReach: "everyone" },
                { sUserName: { $in: followingUsernames } }
            ]
        })
        res.status(200).json({
            message: "Tweets retrieved successfully!",
            tweets: allTweets,
            pagination: {
                total_tweets: totalTweets,
                page,
                limit,
                total_pages: Math.ceil(totalTweets / limit)
            }
        });
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
};

const getEachTweet = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);
        if (!req.params.id)
            return responseHandler(400, "tweetId is a required feild!", res);

        const tweet = await Tweet.findOne({ _id: mongify(req.params.id), eStatus: "y" })
            .populate("aComments.sUserId", "sUserName sName sProfilePic");
        if (!tweet)
            return responseHandler(404, "No tweet found of given tweet id!", res);

        res.status(200).json({
            message: "Tweet with given id reterived successfully!",
            tweet,
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const getFollowingTweets = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);
        const user = await User.findById(req.userId);
        if (!user)
            return responseHandler(404, 'User not found!', res);

        const followingIds = user.aFollowing.map(follow => follow.sUserId);

        const followingUsers = await User.find({ _id: { $in: followingIds } }, 'sUserName');
        const followingUsernames = followingUsers.map(user => user.sUserName);
        const tweets = await Tweet.find({ sUserName: { $in: followingUsernames } });
        res.status(200).json({
            message: "Following tweets reterived successfully!",
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

module.exports = {
    addTweet,
    deleteTweet,
    likeTweet,
    dislikeTweet,
    addRetweet,
    deleteRetweet,
    addComment,
    deleteComment,
    getAllTweets,
    getEachTweet,
    getFollowingTweets
}