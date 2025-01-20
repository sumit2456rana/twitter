const jwt = require('jsonwebtoken');
const middleware = {};

middleware.verifyToken = (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if(!token) 
            return res.status(400).json({
                message: "Invalid access, authorization token required!"
            })
        
        token = token.replace("Bearer ", "");
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if(err) 
                return res.status(400).json({
                    message: "Invalid token!",
                })
            
            req.userId = decoded.id
            next();
        })
    } catch (error) {
        console.log(error);
        res.status(501).json({
            message: "Something went wrong, please try again later!"
        })
    }
}


module.exports = middleware;