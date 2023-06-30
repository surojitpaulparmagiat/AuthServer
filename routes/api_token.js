// routes that will handle token generation and other mode of authentication


const express = require('express');
const { issueAccessAndRefreshToken } = require('../controllers/api_access_token_controller');
const api_token_router = express.Router();


api_token_router.route("/").post(issueAccessAndRefreshToken)

module.exports = api_token_router