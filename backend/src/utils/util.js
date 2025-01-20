const {v2: cloudinary} = require('cloudinary')
const fs = require('fs');

const responseHandler = (code, message, res) => {
    return res.status(code).json({
        message,
    })
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        // upload the file on cloudinary
        const rs = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uploaded successfully
        // console.log("file is uploaded on cloudinary successfully!", rs.url);
        fs.unlinkSync(localFilePath);
        return rs;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload opreation get failed
        return null;
    }
}

module.exports = {
    responseHandler,
    uploadOnCloudinary
}