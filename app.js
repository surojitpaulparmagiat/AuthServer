const dotenv = require("dotenv");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const { OAuthServer, auth_server_model } = require("./OAuthServer");
const bcrypt = require("bcryptjs");
const { AppUnit } = require("./models/AppUnit");
const { generateRandomString } = require("./helpers");

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

const oauth_sever = new OAuthServer({
  model: auth_server_model,
});
app.oauth = oauth_sever;
// a simple function to create a new app/client which must have scopes
const create_new_self_client = async (req, res, next) => {
  const organization_id = "64a3bc208c333c5c7721951f";
  const client_type = "self"; // or "server"
  // for now we only support "self"
  if (client_type === "self") {
    const payload = req?.body;
    // we need those scopes at time of creation
    const scope_as_string = payload.scope;
    const scope = scope_as_string.split(",");
    const client_name = payload.client_name;
    const redirect_uri = payload.redirect_uri;
    const client_type = payload.client_type;

    // random unique name for this app unit
    const client_uid = generateRandomString();
    // create a password with random string, store the password as hash in db
    const client_secret = generateRandomString();
    const salt = await bcrypt.genSalt(10);
    const client_secret_hashed = await bcrypt.hash(client_secret, salt);

    const app_unit_body = {
      organization_id,
      client_name,
      client_uid,
      redirect_uri,
      client_type,
      client_secret: client_secret_hashed,
      client_unit_status: "A",
      token_status: "R",
      scope,
    };
    await AppUnit.create(app_unit_body);

    res.status(201).json({
      client_id: client_uid,
      client_secret,
    });
  }
};

const handle_private_route = (req, res) => {
  res.status(200).json({
    success: true,
  });
}

const handle_token_response = (req, res) => {
  res.status(201).json({
    success: true,
    access_token: req.oauth.access_token,
    refresh_token: req.oauth.refresh_token,
  });
};

const refresh_token_revocation = async (req, res) => {
  res.status(200).json({
    success: true,
  });
}

app.route("/client").post(create_new_self_client);
app.route("/oauth/token/revoke").post(app.oauth.token_revoke(),refresh_token_revocation); // revoke the access token/ refresh token
app.route("/oauth/token").post(app.oauth.token(), handle_token_response); // get the access token using various grant type

app
  .route("/private")
  .get(app.oauth.authenticate({ scope: ["aninvoice.invoices.CREATE"] }), handle_private_route);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
