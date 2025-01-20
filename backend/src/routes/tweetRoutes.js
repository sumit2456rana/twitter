const express = require('express');
const router = express.Router();

const tweetController = require('../controllers/tweetControllers');
const middleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multerMiddleware');

router.post('/api/v1/tweet', middleware.verifyToken, upload.array("photos", 4), tweetController.addTweet);
router.delete('/api/v1/tweet', middleware.verifyToken, tweetController.deleteTweet);
router.post('/api/v1/tweet/like', middleware.verifyToken, tweetController.likeTweet);
router.post('/api/v1/tweet/unlike', middleware.verifyToken, tweetController.dislikeTweet);
router.post('/api/v1/tweet/retweet', middleware.verifyToken, tweetController.addRetweet);
router.delete('/api/v1/tweet/retweet', middleware.verifyToken, tweetController.deleteRetweet);
router.post('/api/v1/tweet/comment', middleware.verifyToken, tweetController.addComment);
router.delete('/api/v1/tweet/comment', middleware.verifyToken, tweetController.deleteComment);
router.get('/api/v1/tweet', middleware.verifyToken, tweetController.getAllTweets);
router.get('/api/v1/tweet/following', middleware.verifyToken, tweetController.getFollowingTweets);
router.get('/api/v1/tweet/:id', middleware.verifyToken, tweetController.getEachTweet);

module.exports = router