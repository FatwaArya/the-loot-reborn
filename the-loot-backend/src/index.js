require('dotenv').config({ path: './config/dev.env' });
console.log(process.env.PORT);
const app = require('./app');
const port = process.env.PORT
app.listen(port, () => console.log(`Listening on port ${port}`));
