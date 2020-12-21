var express = require('express');
var router = express.Router();
var axios = require("axios")

const AUTH_MS_URL = "http://localhost:1337/api/auth-status"

// Auth MS middleware
const authenticate = async (req, res, next)  => {
    try {
        // Check auth status from auth-ms 
        const {data} = await axios.get(AUTH_MS_URL, {headers: {"authorization": req.headers["authorization"]} })
        
        // Pass user data to request {user: {username: "user01"}}
        req.user = data
        next()
    } catch(err) {
        //Session expired or invalid token here
        const {statusCode, message} = err.response.data
        res.status(statusCode).json({message})
    }
}

router.get('/', authenticate,function(req, res) {
  res.status(200).json({data: req.user});
});

module.exports = router;
