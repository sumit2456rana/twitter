const express = require('express');
const middleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userControllers');
const upload = require('../middlewares/multerMiddleware');
const router = express.Router();

router.post('/api/v1/user/follow', middleware.verifyToken, userController.follow);
router.post('/api/v1/user/unfollow', middleware.verifyToken, userController.unfollow);
router.get('/api/v1/user/followers', middleware.verifyToken, userController.getFollowers);
router.get('/api/v1/user/followings', middleware.verifyToken, userController.getFollowings);
router.delete('/api/v1/user/me', middleware.verifyToken, userController.deleteMe);
router.get('/api/v1/user/tweets', middleware.verifyToken, userController.getMyTweets);
router.post('/api/v1/user/info', middleware.verifyToken, userController.getUserInfo);
router.patch('/api/v1/user/me/profile',
    middleware.verifyToken,
    upload.fields([
        {
            name: "profilePic",
            maxCount: 1
        },
        {
            name: "headerImg",
            maxCount: 1
        }
    ]),
    userController.setUpProfile);
router.post('/api/v1/user/bookmark', middleware.verifyToken, userController.addTweetToBookmark);
router.delete('/api/v1/user/bookmark', middleware.verifyToken, userController.removeTweetFromBookmark);
router.get('/api/v1/user/bookmark', middleware.verifyToken, userController.getBookmarkTweets);

module.exports = router;