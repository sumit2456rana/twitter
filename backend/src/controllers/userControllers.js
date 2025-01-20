const Tweet = require("../models/Tweet");
const User = require("../models/User");
const { mongify } = require("../utils/lib/mongodb");
const { responseHandler, uploadOnCloudinary } = require("../utils/util");

const follow = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        if (!req.body.followUserId)
            return responseHandler(400, "followUserId is a required feild!", res);

        if (req.userId === req.body.followUserId)
            return responseHandler(400, "Invalid request!", res);
        const followUser = await User.findOne({ _id: mongify(req.body.followUserId) });

        if (!followUser)
            return responseHandler(400, "Invalid followUserId provided!", res);

        const checkIfAlreadyFollowing = [
            {
                $match: {
                    _id: mongify(req.body.followUserId)
                }
            },
            {
                $unwind: {
                    path: "$aFollowers"
                }
            },
            {
                $match: {
                    "aFollowers.sUserId": mongify(req.userId)
                }
            }
        ]

        const rs = await User.aggregate(checkIfAlreadyFollowing);

        if (rs.length > 0)
            return responseHandler(401, "User is already followed!", res);

        followUser.aFollowers.push({
            sUserId: req.userId,
        })
        const user = await User.findById(req.userId);
        user.aFollowing.push({
            sUserId: req.body.followUserId
        })

        await followUser.save();
        await user.save();

        res.status(200).json({
            message: "User followed successfully!"
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const unfollow = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        if (!req.body.unfollowUserId)
            return responseHandler(401, "unfollowUserId is required feild!", res);

        if (req.userId === req.body.unfollowUserId)
            return responseHandler(401, "Invalid request!", res);
        const unfollowUser = await User.findOne({ _id: mongify(req.body.unfollowUserId) });
        if (!unfollowUser)
            return responseHandler(404, "User with given unfollowUserId is not found!", res);

        const checkIfUserFollowed = [
            {
                $match: {
                    _id: mongify(req.body.unfollowUserId)
                }
            },
            {
                $unwind: {
                    path: "$aFollowers"
                }
            },
            {
                $match: {
                    "aFollowers.sUserId": mongify(req.userId),
                }
            }
        ];

        const rs = await User.aggregate(checkIfUserFollowed);
        if (rs.length === 0)
            return responseHandler(401, "User is not yet followed!", res);

        const idx1 = unfollowUser.aFollowers.findIndex(e =>
            e.sUserId.toString() === req.userId
        );
        unfollowUser.aFollowers.splice(idx1, 1);

        const user = await User.findById(req.userId);
        const idx2 = user.aFollowing.findIndex(e =>
            e.sUserId.toString() === req.body.unfollowUserId
        );
        user.aFollowing.splice(idx2, 1);

        await unfollowUser.save();
        await user.save();

        res.status(200).json({
            message: "User unfollowed successfully!"
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const getFollowers = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        const user = await User.findOne(
            { _id: mongify(req.userId) },
            { aFollowers: 1, _id: 0 }
        ).populate('aFollowers.sUserId', 'sUserName sEmail sProfilePic _id');

        if (!user || !user.aFollowers)
            return responseHandler(401, "Invalid request!", res);

        res.status(200).json({
            message: "User followers retrieved successfully!",
            followers: user.aFollowers
        });
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const getFollowings = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        const user = await User.findOne(
            { _id: mongify(req.userId) },
            { aFollowing: 1, _id: 0 }
        ).populate('aFollowing.sUserId', 'sUserName sEmail sProfilePic _id');

        if (!user || !user.aFollowing)
            return responseHandler(401, "Invalid request!", res);

        res.status(200).json({
            message: "User following retrieved successfully!",
            followers: user.aFollowing
        });
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const deleteMe = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        const user = await User.findById(req.userId);
        if (!user)
            return responseHandler(401, "Invalid access!", res);

        await Tweet.updateMany({ sUserName: user.sUserName }, { eStatus: "d" });
        user.eStatus = "d";
        await user.save();
        res.status(200).json();
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const getMyTweets = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);
        const user = await User.findOne({ _id: mongify(req.userId) });

        if (!user)
            return responseHandler(403, "Access Denied, user is invalid!", res);

        const tweets = await Tweet.find({ sUserName: user.sUserName });

        res.status(200).json({
            message: "Own tweets reterived successfully!",
            tweets,
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const getUserInfo = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);
        if (!req.body.username && !req.body.userId)
            return responseHandler(400, "username or userId is a required feild!", res);

        const user = await User.findOne({ $or: [{sUserName: req.body.username}, {_id: mongify(req.body.userId)}] }, { sPassword: 0, sSalt: 0 });
        if (!user)
            return responseHandler(404, `No user found with the given ${req.body.username ? "username" : "userId"}!`, res);

        res.status(200).json({
            message: "User data reterived successfully!",
            user,
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const setUpProfile = async (req, res) => {
    try {
        if (!req.userId) {
            return responseHandler(403, "User is not authenticated!", res);
        }

        const user = await User.findOne({ _id: mongify(req.userId), eStatus: "y" });
        if (!user) {
            return responseHandler(401, "Invalid access!", res);
        }

        if (Object.keys(req.body).length === 0 && (!req.files || Object.keys(req.files).length === 0)) {
            return responseHandler(401, "Invalid request!", res);
        }

        if (req.body.name) user.sName = req.body.name;
        if (req.body.bio) user.sBio = req.body.bio;

        let profileLocalPath = "";
        let headerImgLocalPath = "";

        if (req.files && Object.keys(req.files).length !== 0) {
            profileLocalPath = req.files.profilePic ? req.files.profilePic[0].path : "";
            headerImgLocalPath = req.files.headerImg ? req.files.headerImg[0].path : "";
        }

        const profilePic = profileLocalPath ? await uploadOnCloudinary(profileLocalPath) : null;
        const headerImg = headerImgLocalPath ? await uploadOnCloudinary(headerImgLocalPath) : null;

        if (profilePic) user.sProfilePic = profilePic.url;
        if (headerImg) user.sHeaderImg = headerImg.url;

        await user.save();
        return res.status(200).json({
            message: "User profile updated successfully!",
        });
    } catch (error) {
        console.error(error);
        return responseHandler(501, "Something went wrong, please try again later!", res);
    }
};

const addTweetToBookmark = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        if (!req.body.tweetId)
            return responseHandler(400, "tweetId is a required feild!", res);

        const user = await User.findOne({ _id: mongify(req.userId) });
        const tweet = await Tweet.findOne({ _id: mongify(req.body.tweetId) });

        if (!user)
            return responseHandler(401, "Invalid access!", res);
        if (!tweet)
            return responseHandler(404, "No tweet found of given id!", res);

        const ifAlreadyBookmarked = [
            {
                $match: {
                    _id: mongify(req.userId)
                }
            },
            {
                $unwind: {
                    path: "$aSavedTweets"
                }
            },
            {
                $match: {
                    "aSavedTweets.sTweetId": mongify(req.body.tweetId)
                }
            }
        ]

        const rs = await User.aggregate(ifAlreadyBookmarked);
        if (rs.length > 0)
            return responseHandler(401, "Tweet is already bookmarked!", res);

        user.aSavedTweets.push({ sTweetId: req.body.tweetId });
        await user.save();

        res.status(200).json({
            message: "Tweet added to bookmark successfully!"
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const removeTweetFromBookmark = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        if (!req.body.tweetId)
            return responseHandler(400, 'tweetId is a required feild!', res);

        const user = await User.findOne({ _id: mongify(req.userId) });
        const tweet = await Tweet.findOne({ _id: mongify(req.body.tweetId) });

        if (!user)
            return responseHandler(401, "Invalid access!", res);
        if (!tweet)
            return responseHandler(404, "No tweet found of given id!", res);

        const checkIfBookmark = [
            {
                $match: {
                    _id: mongify(req.userId)
                }
            },
            {
                $unwind: {
                    path: "$aSavedTweets",
                }
            },
            {
                $match: {
                    "aSavedTweets.sTweetId": mongify(req.body.tweetId),
                }
            }
        ]

        const rs = await User.aggregate(checkIfBookmark);
        console.log(rs);
        if (rs.length === 0)
            return responseHandler(401, "Tweet is not bookmark yet!", res);
        const idx = user.aSavedTweets.findIndex(e => e.sTweetId.toString() === req.body.tweetId.toString());
        user.aSavedTweets.splice(idx, 1);
        await user.save();
        res.status(200).json({
            message: "Tweet removed successfully from bookmarks!"
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

const getBookmarkTweets = async (req, res) => {
    try {
        if (!req.userId)
            return responseHandler(403, "User is not authenticated!", res);

        const user = await User.findOne({ _id: mongify(req.userId) }, { aSavedTweets: 1, _id: 0 }).populate('aSavedTweets.sTweetId');

        if (!user)
            return responseHandler(401, "Invalid access!", res);

        res.status(200).json({
            message: "Bookmark tweet reterived successfully!",
            tweet: user.aSavedTweets,
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, "Something went wrong, please try again later!", res);
    }
}

module.exports = {
    follow,
    unfollow,
    getFollowers,
    getFollowings,
    deleteMe,
    getMyTweets,
    getUserInfo,
    setUpProfile,
    addTweetToBookmark,
    removeTweetFromBookmark,
    getBookmarkTweets
}