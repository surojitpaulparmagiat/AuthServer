const jwt = require("jsonwebtoken");
const { JWT_SEC } = require("./helpers");
const { AppUnit } = require("./models/AppUnit");
const bcrypt = require("bcryptjs");

const access_token_expires_in = 3600;

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
  verifyAccessToken: async function (token, request) {
    try {
      const { client_type, organization_id, client_id } = jwt.verify(
        token,
        JWT_SEC
      );

      let scope;
      if (client_type === "self") {
        // scopes are saved in the app itself
        const app_unit = await AppUnit.findOne({
          client_uid: client_id,
        }).lean();

        if (token !== app_unit.access_token || app_unit.token_status === "R") {
          throw new Error("Invalid access token");
        }
        scope = app_unit.scope;
      }
      return { success: true, scope };
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

    // requested_scopes must also be an array
    if (!Array.isArray(requested_scopes)) {
      return false;
    }

    if (!Array.isArray(allowed_scopes)) {
      return false;
    }

    return requested_scopes.every((s) => allowed_scopes.indexOf(s) >= 0);
  },

  // FOR AUTHENTICATION
  // get the client from db and also authenticate, return {success, client} if true else {success : false, message: "Client secret is incorrect"}
  getClient: async function (client_id, client_secret) {
    const app_unit = await AppUnit.findOne({ client_uid: client_id });
    const is_client_secret_correct = await bcrypt.compare(
      client_secret,
      client_data.client_secret
    );
    if (!is_client_secret_correct) {
      return { success: false, message: "Client secret is incorrect" };
    }

    return { success: is_client_secret_correct, client: app_unit };
  },
  // same as getClient but for user, for testing we return {success : true, user}
  getUser: async function (user_data_from_body) {
    if (
      (user_data_from_body.email =
        "johndoe" && user_data_from_body.password === "123456")
    ) {
      return { success: true, user: user_data_from_body };
    }
  },
  generateAndSaveAuthorizationCode: async function (client, user, scope) {
    // generate a random jwt token with validation for 60 sec save it in db.
  },
  // todo: we don't need it now.
  verifyAuthorizationCode: function (client_id, client_secret, code) {
    // here code is a jwt token, it have a organization_id in it which will be used to find the client-user unit.
    return true;
  },

  // FOR TOKEN GENERATION
  // return true or false, depending on correctness of client credentials
  verifyClientCredentials: async function (client_id, client_secret) {
    const app_unit = await AppUnit.findOne({ client_uid: client_id });
    const is_client_secret_correct = await bcrypt.compare(
      client_secret,
      app_unit.client_secret
    );

    return is_client_secret_correct;
  },

  // generate token for different type of client, save then in db and return
  generateAndSaveToken: async function (grant_type, client_id, code_or_token) {
    // must return and access_token and a refresh_token,
    // and we must save them in db
    const app_unit = await AppUnit.findOne({ client_uid: client_id }).lean();

    if (
      (app_unit.client_type === "self" &&
        grant_type === "client_credentials") ||
      grant_type === "refresh_token"
    ) {
      // find data of this client

      const access_token = jwt.sign(
        {
          client_id: app_unit.client_uid,
          client_type: app_unit.client_type,
          organization_id: app_unit.organization_id,
        },
        JWT_SEC,
        {
          expiresIn: access_token_expires_in,
        }
      );
      const refresh_token = jwt.sign(
        {
          client_type: app_unit.client_type,
          client_id: app_unit.client_uid,
        },
        JWT_SEC
      );
      await AppUnit.findByIdAndUpdate(
        { _id: app_unit._id },
        {
          refresh_token,
          access_token,
          token_status: "A",
        }
      );
      // save these 2 tokens in db
      return {
        access_token,
        refresh_token,
      };
    }
  },
  // return true or false, depending on correctness of refresh token
  verifyRefreshToken: async function (refresh_token, request) {
    try {
      const { client_type, organization_id, client_id } = jwt.verify(
        refresh_token,
        JWT_SEC
      );
      // check if token actually exists in
      const app_unit = await AppUnit.findOne(
        { client_uid: client_id },
        { refresh_token: 1 }
      );
      if (refresh_token !== app_unit.refresh_token) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  // FOR TOKEN REVOCATION
  // return true if revocation is success full
  revokeRefreshToken: async function (refresh_token, request) {
    try {
      const { client_id } = jwt.verify(refresh_token, JWT_SEC);
      const app_unit = await AppUnit.findOne({ client_uid: client_id });
      if (refresh_token !== app_unit.refresh_token) {
        return false;
      }
      await AppUnit.findOneAndUpdate(
        {
          client_uid: client_id,
        },
        {
          refresh_token: null,
          access_token: null,
          token_status: "R",
        }
      );

      return true;
    } catch (error) {
      return true;
    }
    // delete access and refresh token from db
  },
};

class OAuthServer {
  constructor({ grants, model }) {
    this.grants = grants;
    this.model = model;
  }

  /*
  Before each private/protected api call, register this middleware with scope
  */
  authenticate({ scope }) {
    return async (req, res, next) => {
      // authenticate the user.
      // with some series of model method calls

      // first get the token using the function call getTokenFromRequest
      const access_token = this.model.getTokenFromRequest(req);

      // second we verify the token, this function must return an object with key "success" true or false
      const { success, scope: client_scope } =
        await this.model.verifyAccessToken(access_token, req);
      if (!success) {
        return res.status(401).json({
          success: false,
          message: "Invalid access token",
        });
      }

      // if "scope" exist as a string or as an array, then we also verify the scopes
      // this is like roles for user, but this time it is for the client
      if (scope) {
        const is_scope_valid = this.model.verifyScope(scope, client_scope); // first the scope app want to access, second the scope permission the app has
        if (!is_scope_valid) {
          return res.status(401).json({
            success: false,
            message: "Invalid scope",
          });
        }
      }

      req.oauth = { access_token };
      next();
    };
  }

  /**
  when using authorization_code grant type, then call this endpoint from
  the user permission request form, with user credentials, client id, and also the scope
  those scope will be saved in a client-user related table.
  */
  authorize() {
    // (generate a grant token) return the initial "code" "response_type" is  "code",
    // here we need scope, client id, a optional state, and "redirect_uri", and user credentials
    // now after getting all this value from frontend, we validate. and redirect to the "redirect_uri" attaching "?code=" and "?state="
    // we also save some user/client related data in here.
    (req, res, next) => {
      const payload = req.body;
      // scope
      const client_id = payload.client_id;
    };
  }

  /* 
  verify "code" and client credentials if grant type is "authorization_code"
  verify client credentials " if grant type is "client_credential"
  verify "refresh_token "  if grant type is "refresh_token"
  and return a new access token and another refresh token
  */
  token() {
    return async (req, res, next) => {
      const {
        client_id,
        client_secret,
        grant_type,
        state,
        refresh_token: refresh_token_from_request,
      } = req.query;

      if (grant_type === undefined) {
        return res.status(400).json({
          success: false,
          message: "grant_type is required",
        });
      }

      // before any kind of token generation we need to verify client credentials
      if (client_id === undefined || client_secret === undefined) {
        return res.status(400).json({
          success: false,
          message: "client_id and client_secret is required",
        });
      }

      const is_client_verified = await this.model.verifyClientCredentials(
        client_id,
        client_secret
      );
      if (!is_client_verified) {
        return res.status(400).json({
          success: false,
          message: "client_id and client_secret is incorrect",
        });
      }

      let access_token;
      let refresh_token;
      if (grant_type === "authorization_code") {
        return res.status(400).json({
          success: false,
          message: "Not implemented",
        });
        // // fetch the code from the request params
        // const code = req.params.code;
        // if (code === undefined) {
        //   res.status(400).json({
        //     success: false,
        //     message: "code is required",
        //   });
        // }
        // // verify the code
        // const is_code_verified = await this.model.verifyAuthorizationCode(
        //   client_id,
        //   client_secret,
        //   code
        // );
        // if (!is_code_verified) {
        //   return res.status(400).json({
        //     success: false,
        //     message: "code is incorrect",
        //   });
        // }
        // const tokens = await this.model.generateAndSaveToken(
        //   grant_type,
        //   client_id,
        //   code
        // );
        // access_token = tokens.access_token;
        // refresh_token = tokens.refresh_token;
      } else if (grant_type === "client_credentials") {
        // we just generate a token, which can be used only for that client
        const tokens = await this.model.generateAndSaveToken(
          grant_type,
          client_id
        );
        access_token = tokens.access_token;
        refresh_token = tokens.refresh_token;
      } else if (grant_type === "refresh_token") {
        if (refresh_token_from_request === undefined) {
          return res.status(400).json({
            success: false,
            message: "refresh_token is required",
          });
        }
        const is_refresh_token_valid = await this.model.verifyRefreshToken(
          refresh_token_from_request,
          req
        );
        if (!is_refresh_token_valid) {
          return res.status(400).json({
            success: false,
            message: "refresh_token is invalid or revoked",
          });
        }
        const tokens = await this.model.generateAndSaveToken(
          grant_type,
          client_id,
          refresh_token_from_request
        );
        access_token = tokens.access_token;
        refresh_token = tokens.refresh_token;
      }

      if (
        access_token &&
        refresh_token &&
        access_token.length > 0 &&
        refresh_token.length > 0
      ) {
        const toke_response = {
          access_token,
          refresh_token,
          expires_in: access_token_expires_in,
          client_id,
        };
        if (state) {
          toke_response.state = state;
        }
        req.oauth = toke_response;
        return next();
      } else {
        return res.status(400).json({
          success: false,
          message: "can not get access_token and refresh_token",
        });
      }
    };
  }

  token_revoke() {
   return (req, res, next) => {
      const refresh_token = req.query.token;
      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: "refresh_token is required",
        });
      }
      // revoke an refresh token
      const is_refresh_token_revoked = this.model.revokeRefreshToken(
        refresh_token,
        req
      );
      if (is_refresh_token_revoked) {
        return next();
      }
      else{
        return res.status(400).json({
          success: false,
          message: "can not revoke refresh_token",
        });
      }

    };
  }
}

module.exports = { OAuthServer, auth_server_model };
