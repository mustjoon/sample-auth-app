var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var axios = require("axios")
var bodyparser = require("body-parser")
var { createProxyMiddleware } = require("http-proxy-middleware");

const AUTH_MS_URL = "http://localhost:1337/api/"

// Auth MS middleware
const authenticate = async (req, res, next)  => {
  try {
      // Check auth status from auth-ms 
      const {data} = await axios.get(AUTH_MS_URL + '/auth-status', {headers: {"authorization": req.headers["authorization"]} })
      
      // Pass user data to request {user: {username: "user01"}}
      req.user = data
      next()
  } catch(err) {
      //Session expired or invalid token here
      const {statusCode, message} = err.response.data
      res.status(statusCode).json({message})
  }
}

var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const proxyOptions = {
  target: AUTH_MS_URL,
  onProxyReq:  (proxyReq, req, res) => {
  if (!req.body || !Object.keys(req.body).length) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type');
  const writeBody = (bodyData) => {
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  };

  if (contentType === 'application/json') {
    writeBody(JSON.stringify(req.body));
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    writeBody(querystring.stringify(req.body));
  }
}
}

// Proxy for receiving auth tokens etc
app.use('/auth', createProxyMiddleware(proxyOptions));
app.use(bodyparser.json());

app.get('/secured-endpoint', authenticate,function(req, res) {
  res.status(200).json({data: req.user});
});


module.exports = app;
