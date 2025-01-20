const User = require('../models/User');
const { responseHandler } = require('../utils/util');
const nodemailer = require('nodemailer');

const util = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const scrypt = util.promisify(crypto.scrypt);

const register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        if (!email)
            return responseHandler(400, "email is required feild for registration!", res);
        if (!username)
            return responseHandler(400, "username is required feild for registration!", res);
        if (!password)
            return responseHandler(400, "password is required feild for registration!", res);
        if (!_.isEmail(email))
            return responseHandler(400, "email is invalid!", res);
        if (!_.isUserName(username))
            return responseHandler(400, "username is invalid!", res);
        // if(!_.isPassword(req.body.password))
        //     return responseHandler(400, "Password must be between 8 to 15 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (#?!@$%^&*-)", res);

        const existingUser = await User.findOne({
            $or: [{ sEmail: email }, { sUserName: username }]
        });

        if (existingUser) {
            if (existingUser.sEmail === email)
                return responseHandler(400, "Email is already in use!", res);
            if (existingUser.sUserName === username)
                return responseHandler(400, "Username is already in use!", res);
        }

        const { hassedPassword, salt } = await encryptPassword(password);
        const newUser = await User.create({
            sEmail: email,
            sUserName: username,
            sPassword: hassedPassword.toString('hex'),
            sSalt: salt,
        })

        const token = makeToken(newUser._id, 1);
        res.status(201).json({
            message: "User registered successfully!",
            token
        })
    } catch (error) {
        console.log(error);
        res.status(501).json({
            message: "Something went wrong!",
            error
        })
    }
}

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email)
            return responseHandler(400, "email is required for login!", res);
        if (!password)
            return responseHandler(400, "password is required for login!", res);

        const userFound = await User.findOne({ sEmail: email, eStatus: 'y' });

        if (!userFound)
            return responseHandler(404, "No user exists with this email id or probably user is not active!", res);

        const rs = await checkPassword(password, userFound.sSalt, userFound.sPassword);

        if (!rs)
            return responseHandler(404, "Given email id or password is invalid!", res);

        const token = makeToken(userFound._id, 1);

        res.status(200).json({
            message: "User logged in successfully!",
            token
        })
    } catch (error) {
        console.log(error);
        res.status(501).json({
            message: "Something went wrong!",
            error
        })
    }
}

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            responseHandler(400, 'email is a required feild!', res);

        const user = await User.findOne({ sEmail: email });
        if (!user)
            return responseHandler(404, 'User not exists!', res);

        const randomString = crypto.randomBytes(12).toString('hex');
        const expirationTime = Date.now() + 3600000;

        await User.updateOne({ sEmail: email }, {
            $set: {
                sResetPasswordToken: randomString,
                sResetPasswordExpiresIn: expirationTime
            }
        });
        sendResetPasswordMail(user.sUserName, user.sEmail, randomString);
        responseHandler(200, "Please check your inbox!", res);
    } catch (error) {
        console.log(error);
        responseHandler(501, 'Something went wrong, please try again later!', res);
    }
}

const resetPassword = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({ sResetPasswordToken: token });
        if (!tokenData)
            return responseHandler(404, "Invalid token!", res);

        if (Date.now() > tokenData.sResetPasswordTokenExpiry) {
            return responseHandler(400, "Link has expired!", res);
        }

        if (!req.body.password)
            return responseHandler(400, "password is a required feild!", res);

        const hassedPassword = await scrypt(req.body.password, tokenData.sSalt, 64);
        const userData = await User.findByIdAndUpdate({ _id: tokenData._id }, {
            $set: {
                sPassword: hassedPassword.toString('hex'),
                sResetPasswordToken: '',
                sResetPasswordExpiresIn: null
            }
        }, { new: true });
        res.status(200).json({
            message: "Password has been updated successfully!",
            data: userData,
        })
    } catch (error) {
        console.log(error);
        responseHandler(501, 'Something went wrong, please try again later!', res);
    }
}

const encryptPassword = async (password) => {
    const salt = crypto.randomBytes(8).toString('hex');
    const hassedPassword = await scrypt(password, salt, 64);
    return { hassedPassword, salt };
}

const makeToken = (id, expireIn) => {
    try {
        return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: `${expireIn}h` });
    } catch (error) {
        return error;
    }
}

const checkPassword = async (password, salt, hassedPassword) => {
    const generatedPassword = await scrypt(password, salt, 64);
    return generatedPassword.toString('hex') === hassedPassword;
}

const sendResetPasswordMail = async (username, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        const link = `http://${process.env.CLIENT_URL}/api/v1/auth/reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password reset request',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
                    <h2 style="color: #1DA1F2;">Hello, @${username}!</h2>
                    <p>We received a request to reset your password for your Twitter clone account.</p>
                    <p>If you didn't make this request, you can ignore this email. Otherwise, click the link below to reset your password:</p>
                    <a href="${link}" style="display: inline-block; padding: 10px 20px; margin: 10px 0; background-color: #1DA1F2; color: #ffffff; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>Thank you for using our service!</p>
                    <p>Best regards,</p>
                    <p>The Twitter Clone Team</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log(error);
        });
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
};

module.exports = {
    register,
    login,
    forgetPassword,
    resetPassword
}