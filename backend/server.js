// creating an express server
const express = require('express');
const app = express();

const {mongodb} = require('./src/utils/index');

// setting up the .env file content
require('dotenv').config();

// connneting to the mongodb 
mongodb.initialize();

// setting global variables
require('./src/globals/index');

const authRoutes = require('./src/routes/authRoutes');
const tweetRoutes = require('./src/routes/tweetRoutes');
const userRoutes = require('./src/routes/userRoutes');

// setting up express json parser
app.use(express.json());


app.use(authRoutes);
app.use(tweetRoutes);
app.use(userRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is started in ${process.env.APP_KEY || 'Dev'} on port ${PORT}!`);
})