
const express = require('express');
const { grantOAuthAndRedirect } = require('../controllers/oauth_grant_controller');
const oauth_grant_router = express.Router();


oauth_grant_router.route("/").get((grantOAuthAndRedirect))

module.exports = oauth_grant_router