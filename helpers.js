const crypto = require("crypto")
const generateRandomString = ()=>{
    const re = crypto.randomBytes(20).toString('hex');
    return re;
}

const JWT_SEC = "42425WECW5E452D4VEW4B5WE4E4BWnwengjnj45551fasv2154qev534v";

const healthPlaceHolder = (req,res,next)=>{res.status(200).json({status:"OK"})}


module.exports = {generateRandomString,JWT_SEC,healthPlaceHolder}