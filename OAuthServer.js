const jwt = require("jsonwebtoken");
const { JWT_SEC } = require("./helpers");

const auth_server_model = {
  // method to get token from "request"
  // it is a bearer token
  getTokenFromRequest: function (request) {
    // logic how to get token from request
    // we return token
    const token = request.headers.authorization.split(" ")[1];
    return token;
  },

  // custom logic to verify access token
  // this can throw error
  verifyAccessToken: function (token, request) {
    try {
      const decoded_value = jwt.verify(token, JWT_SEC);
      request.user = decoded_value;
      // TODO: we fetch this from database and let is pass through here, which can be used in "verifyScope"
      return { success: true, scope: "aninvoice.invoice.CREATE" }; //
    } catch (error) {
      return {
        success: false,
        message: "Invalid access token",
      };
    }
  },

  // verify scope
  // request_scope: "aninvoice.invoice.CREATE", allowed_scopes: ["aninvoice.invoice.CREATE","aninvoice.invoice.READ"] etc.
  // here we verify the scope, if scope is not in allowed_scopes, then we throw error
  verifyScope: function (requested_scopes, allowed_scopes) {
    // scope must be present, in our case.
    if (requested_scopes === undefined) {
      return false;
    }

    // allowed_scopes must also be an array
    if (!Array.isArray(allowed_scopes)) {
      return false;
    }

    let req_sc = [];
    if (typeof requested_scopes === "string") {
      req_sc = allowed_scopes.split(",");
    } else if (Array.isArray(requested_scopes)) {
      req_sc = request_scopes;
    }

    return req_sc.every((s) => allowed_scopes.indexOf(s) >= 0);
  },
};

class OAuthServer {
  constructor({ grants, model }) {
    this.grants = grants;
    this.model = model;
  }

  // this methods will work as middleware of express
  // use this before every protected routes
  authenticate({ scope }) {
    return (req, res, next) => {
      // authenticate the user.
      // with some series of model method calls

      // first get the token using the function call getTokenFromRequest
      const token = this.model.getTokenFromRequest(req);

      // second we verify the token, this function must return an object with key "success" true or false
      const { success, scope: client_scope } = this.model.verifyAccessToken(
        token,
        req
      );
      if (!success) {
        return res.status(401).json({
          success: false,
          message: "Invalid access token",
        });
      }

      // if "scope" exist as a string or as an array, then we also verify the scopes
      // this is like roles for user, but this time it is for the client
      if (scope) {
        const is_scope_valid = this.model.verifyScope(client_scope, scope);
        if (!is_scope_valid) {
          return res.status(401).json({
            success: false,
            message: "Invalid scope",
          });
        }
      }

      req.locals.token = token;
      next();
    };
  }

  // our internal code will call this endpoint
  // this methods will work as middleware of express
  // to accept grant and return "authorization_code"
  authorize(){

    // (generate a grant token) return the initial "code" "response_type" is  "code",
    // here we need scope, client id, a optional state, and "redirect_uri", and user credentials 
    // now after getting all this value from frontend, we validate. and redirect to the "redirect_uri" attaching "?code=" and "?state="
    // we also save some user/client related data in here.
    (req, res, next) => {
        const payload = req.body;
        // scope
        
    }
  }



}



const Server = new OAuthServer({
    model : auth_server_model
})