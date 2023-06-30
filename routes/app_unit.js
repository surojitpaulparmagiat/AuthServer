// register a new app, and gain access token to modify that app.
// a new register should not require any previous token
const express = require('express');
const { createAppUnit } = require('../controllers/app_unit_controller');
const app_unit_router = express.Router();

const healthPlaceHolder = (req,res,next)=>{res.status(200).json({status:"OK"})}

app_unit_router.route("/").post(createAppUnit)

module.exports = app_unit_router