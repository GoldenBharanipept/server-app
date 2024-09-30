//////Configuration
const PORT = 3000;
const allowlist = ['aptipro.ai', 'localhost:3000', '37e2-2401-4900-1ce3-8f63-adc6-9e9d-5bd5-e90e.ngrok-free.app', '16.171.26.35:3000'];
const API_BASE = 'http://api.qa.aptipro.ai:8080';
const HOST = 'http://api.qa.aptipro.ai';
const tokenStr = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMyIsImVtYWlsIjoiYXNoY29kZTk5OEBnbWFpbC5jb20iLCJpZCI6MTMsInBob25lIjoiOTkwMTgzNTEwMSIsImhhc0FwdGl0dWRlU3Vic2NyaXB0aW9uIjp0cnVlLCJhcHRpdHVkZVN1YnNjcmlwdGlvbkVuZERhdGUiOjE3MjkwODY0ODgwMDAsImNvdXJzZVN1YnNjcmlwdGlvbnMiOnsiNjYiOjE3MjgxMjIxNTMwMDAsIjgyIjoxNzI4MTM4MDE2MDAwLCI3MCI6MTc1NzMzMTI4MjAwMCwiNDIiOjE3Mjg4MTk5OTcwMDAsIjE1IjoxNzI5MDg2NDg4MDAwfSwicGFyZW50X3VzZXJfaWQiOjEzLCJyZWdpc3RlcmVkQXQiOjE3MTg2MTMzMTYwMDAsImlhdCI6MTcyNzQzNjM1OCwiaXNzIjoiYXB0aXBybyIsImV4cCI6MTczMTI3OTM1OH0.maCm3pl5r63Qoz2qSFHCl1W7BkIuqUGh7pG8XlHP8NNhLzxoG4bg9QmznywAjoxMIXHwGVnlTmeIUENqIifU2A';
//////Library references
const express = require('express');
const app = express();
const path = require('path');
const expressStaticGzip = require("express-static-gzip");
const cors = require('cors');
const compression = require('compression');
const axios = require('axios');
/////Iframe response header restriction
app.use(
  (request, response, next) => {
    console.log(request.headers['user-agent']);
    const ip = request.headers['x-forwarded-for'] ||
      request.socket.remoteAddress ||
      null;
    console.log('IP = ' + ip);
    response.set('X-Frame-Options', 'deny');
    response.set('X-Powered-By', 'encrypted');
    response.set('Cache-Control', 'no-cache,no-store,max-age=0,must-revalidate');
    response.set('Pragma', 'no-cache');
    response.set('Expires', '-1');
    response.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.set('X-XSS-Protection', '1;mode=block');
    if (allowlist.indexOf(request.headers.host) !== -1) {
      next();
    } else {
      response.sendStatus(401);
    }
  },
  express.static('public')
);

/////Origin restriction
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = {
      origin: true
    }
  } else {
    corsOptions = {
      origin: false
    }
  }
  callback(null, corsOptions)
}
app.use(cors(corsOptionsDelegate));

///Compression reference libraries
app.use(compression());

/////HTML view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
/////SEO meta tag generator
app.get('/author', function (req, res) {
  if (req.query.id) {
    axios.get(API_BASE + '/course/getCourseOwnerDetailsByOwnerId/' + req.query.id)
      .then(function (response) {
        if (response.data.status) {
          axios.post(API_BASE + '/lms/course/getAllCourses', {
              "courseName": "",
              "authorName": ""
            }, {
              headers: {
                "Authorization": `Bearer ${tokenStr}`
              }
            })
            .then(function (courseReponse) {
              if (courseReponse.data.status) {
                var description = '';
                courseReponse.data.data.forEach(element => {
                  if (element.course.ownerId == response.data.data.userIdKey && element.course.status == 'APPROVED') {
                    description += element.course.name + ' | ' + element.course.description + ' | ' + element.course.primaryLanguage + ',' + element.course.secondaryLanguage + ' | ';
                  }
                });
                res.render('start', {
                  data: response.data.data,
                  description: description,
                  host: HOST
                });
              } else {
                res.sendStatus(401)
              }
            })
            .catch(function (error) {
              console.log(error)
              res.sendStatus(401);
            })
        } else {
          res.sendStatus(401)
        }
      })
      .catch(function (error) {
        console.log(error)
        res.sendStatus(401);
      })
  } else {
    res.sendStatus(401);
  }
});
app.use("/", expressStaticGzip('dist-compressed'));
app.use("*", expressStaticGzip('dist-compressed'));



////PORT listener
app.listen(PORT, () => {
  console.log(`application is listening on port ${PORT}`);
});
