const express = require('express');
const app = express();
const cors = require('cors');
const userRoute = require('./router/user');
const merchantRoute = require('./router/merchant');

require('./db/mongoose');

// app.use(cors(
//     {
//         origin: 'localhost:3000'
//     }
// ));
app.use(express.json());
app.use(userRoute);
app.use(merchantRoute);



module.exports = app;