const { AppUnit } = require("../models/AppUnit");
const { generateRandomString, JWT_SEC } = require("../helpers");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/*
validate the "code" if valid then issue 1 access token (for 1hr) and 1 refresh token
store the refresh 
*/
const issueAccessAndRefreshToken = async (req, res, next) => {
  const query = req.query;

  // response_type must be "code" for a "web" client type
  // redirect must be present.

  // find the app unit id using client_id present in the payload
  const client_uid = query.client_id;
  const client_secret = query.client_secret;
  const code = query.code; // in our case this is a jwt token with validity of 60 sec
  const redirect_uri = query.redirect_uri;
  const state = query.state;

  const app_unit = await AppUnit.findOne({
    client_uid: client_uid,
    app_unit_status: "A",
  });

  // app does not exists
  if (app_unit === null) {
    return res.status(404).json({
      success: false,
      code: 0,
      message: "App unit does not exists",
    });
  }

  // check if the client secret is correct
  const isClientSecretCorrect = await bcrypt.compare(
    client_secret,
    app_unit.client_secret
  );
  if (!isClientSecretCorrect) {
    return res.status(404).json({
      success: false,
      code: 0,
      message: "Client secret is incorrect",
    });
  }

  // redirect uri does not match
  if (redirect_uri !== app_unit.redirect_uri) {
    return res.status(404).json({
      success: false,
      code: 0,
      message: "Redirect uri does not match",
    });
  }

  try {
    // verify the code, a nested error is used
    try {
     jwt.verify(code, JWT_SEC);
      if (code !== app_unit.temp_code) {
        throw new Error("Invalid code");
      }
    } catch(error) {
      // throw error if code is invalid
      return res.status(400).json({
        success: false,
        code: 0,
        message: "Invalid or Expired code",
      });
    }

    // if success, then generate an access token with 1 hour expiration
    // and a refresh token with no expiration
    const access_token_expires_in = 3600;
    const access_token = jwt.sign(
      {
        app_unit_id: app_unit._id,
      },
      JWT_SEC,
      {
        expiresIn: access_token_expires_in,
      }
    );
    const refresh_token = jwt.sign(
      {
        app_unit_id: app_unit._id,
      },
      JWT_SEC
    );

    // we make the temp_code to null, set refresh token and access token
    await AppUnit.findByIdAndUpdate(
      { _id: app_unit._id },
      {
        temp_code: null,
        refresh_token,
        access_token,
        token_status: "A",
      }
    );

    res.status(200).json({
      access_token,
      refresh_token,
      "token_type": "Bearer",
      "expires_in": access_token_expires_in,
    })
  } catch (error) {
    console.log("Error", error);
  }
};

module.exports = { issueAccessAndRefreshToken };
