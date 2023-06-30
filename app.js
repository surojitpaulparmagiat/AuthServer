const dotenv = require('dotenv');
const mongoose = require("mongoose");
const express = require('express');
const cors = require('cors');
const app_unit_router = require("./routes/app_unit")
const api_token_router = require("./routes/api_token")
const oauth_grant_router = require("./routes/oauth_grant")


dotenv.config();

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
  });

  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

connectDB();
const app = express();
app.use(express.json());
app.use(cors());

// create a client
app.use("/oauth_client",app_unit_router) 

// get code by using grant type
app.use("/oauth/auth",oauth_grant_router)

// get refresh and access token by presenting the code with client credential
app.use("/oauth/token",api_token_router)






const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
