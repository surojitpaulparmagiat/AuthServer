const { AppUnit } = require("../models/AppUnit");
const { generateRandomString, JWT_SEC } = require("../helpers");
const jwt = require("jsonwebtoken");

/*
The client must redirect to this url and we show a login page or permission page to the user.
warning: for testing purpose we make and http call to backend directly. a consent from user is must.
This code snippet is a function called grantOAuthAndRedirect that handles a request to redirect the client to a login or permission page. 
It first retrieves the necessary parameters from the request query, such as client_id, redirect_uri, response_type, and scope.
It then looks for an AppUnit in the database based on the client_id and checks if it exists and if the redirect_uri matches. 
If everything is valid, it generates a random string, signs it with a JWT secret, and updates the temp_code field of the AppUnit. 
Finally, it responds with a JSON object containing the generated code.
*/
const grantOAuthAndRedirect = async (req, res, next) => {
  const query = req.query;
  // in this body we have some mandatory fields such as
  // scope, client_id, response_type, redirect_uri
  // scope is a comma separated string  for access (eg. ANINVOICE.invoices.CREATE, ANINVOICE.invoices.READ)
  // response_type must be "code" for a "web" client type
  // redirect must be present.

  // find the app unit id using client_id present in the payload
  const client_uid = query.client_id;
  const redirect_uri = query.redirect_uri;
  const response_type = query.response_type;
  const scope_as_string = query.scope;
  const state = query.state;

  const app_unit = await AppUnit.findOne({
    client_uid: client_uid,
    app_unit_status: "A",
  });
  if (app_unit === null) {
    return res.status(404).json({
      success: false,
      code: 0,
      message: "App unit does not exists",
    });
  }
  if (redirect_uri !== app_unit.redirect_uri) {
    return res.status(404).json({
      success: false,
      code: 0,
      message: "Redirect uri does not match",
    });
  }
  try {
    // scopes will be set inside app unit ?
    // after authorization we accept the grant request and generate a code.
    if (true) {
      // generate a random string that will be served as base
      const rand_string = generateRandomString();
      const jwt_token = jwt.sign({ rand_string }, JWT_SEC, { expiresIn: 120 });
      await AppUnit.findByIdAndUpdate(
        { _id: app_unit._id },
        {
          client_uid: client_uid,
          temp_code: jwt_token,
        }
      );
      const res_body = {
        code: jwt_token,
      };
      if (state) {
        res_body["state"] = state;
      }
      res.status(200).json(res_body);
    }
  } catch (error) {
    console.log("Error", error);
  }
};

module.exports = { grantOAuthAndRedirect };
