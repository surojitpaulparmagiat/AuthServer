const bcrypt = require("bcryptjs");
const { AppUnit } = require("../models/AppUnit");
const { generateRandomString } = require("../helpers");
const jwt = require("jsonwebtoken");


/*
Create a new app/client, no api key or token will be generated here.
A client id and secret will be generated and provided to the creation for one time, and it can not changed.
*/
const createAppUnit = async (req, res, next) => {
  const payload = req.body;

  const client_name = payload.client_name;
  const redirect_uri = payload.redirect_uri;
  const home_page_url = payload.home_page_url;
  const client_type = payload.client_type; // must be "web"

  if (client_type !== "web") {
    return res.status(400).json({
      success: false,
      code: 0,
      message: "We currently support for web client only",
    });
  }

  // random unique name for this app unit
  const client_uid = generateRandomString();
  // create a password with random string, store the password as hash in db
  const client_secret = generateRandomString();
  const salt = await bcrypt.genSalt(10);
  const client_secret_hashed = await bcrypt.hash(client_secret, salt);

  const app_unit_body = {
    client_name,
    client_uid,
    home_page_url,
    redirect_uri,
    client_type,

    client_secret: client_secret_hashed,
    app_unit_status: "A",
    token_status: "R",
  };
  await AppUnit.create(app_unit_body);

  res.status(201).json({
    client_uid,
    client_secret,
  });
};

module.exports = { createAppUnit };
