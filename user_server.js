const express = require('express');
const app = express();
const userRouter = require('./user/Routes');
const bodyParser = require('body-parser');
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));


app.use('/user', userRouter);



app.listen(port, () => console.log(`User server running on port ${port}`));
