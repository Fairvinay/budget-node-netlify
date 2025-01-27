import cors from 'cors';
import morgan from 'morgan';
// import = require('express');
import express from "express";
import {  Application, Request,  Response , NextFunction} from "express";
import {IncomingHttpHeaders} from 'http';
import session from 'express-session';
import * as csrf from 'csurf';
//import csrfCookieSetter from '.src/utils/set-csrf-cookie';
import passport from './src/app/auth/passport';
import routes from './src/routes';
import config from './src/config';
import errorHandler from './src/utils/error-handler';
import serveIndex from './src/utils/serve-index';
import logger from './src/utils/logger';
import { User } from './src/models/user';
import fs  from   'fs';
import https from 'https'
import http from 'http'
import path from 'path'
import 'localstorage-polyfill'

global.localStorage = localStorage;
declare module 'express-session' {
  interface SessionData { user: User | null | undefined }
}
console.log("ssl at : "+path.resolve(__dirname, './budget-node/ssl.key/serveractual.key'))

if (typeof localStorage === "undefined" || localStorage === null) {
   const LocalStorage = require('node-localstorage').LocalStorage;
   localStorage = new LocalStorage('./scratch');
}

localStorage.setItem('myFirstKey', 'myFirstValue');
console.log(localStorage.getItem('myFirstKey'));

const privateKey  = fs.readFileSync(path.resolve(__dirname, './budget-node/src/ssl.key/serveractual.key'), 'utf8');
const certificate = fs.readFileSync(path.resolve(__dirname,'./budget-node/ssl.crt/serveractual.crt'), 'utf8');
const credentials = {key: privateKey, cert: certificate};
const app: Application = express();
// app.use(express.static('../angular/dist/'));
//const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer( app);
const ip = '0.0.0.0'; // '192.168.32.1';
app.use(session(config.sessionConfig));
app.use(morgan(config.morganPattern, { stream: config.morganStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
const originsWhitelist = [
  'https://192.168.1.4:8000','https://192.168.1.4:8080',
   'https://192.168.1.7','https://192.168.1.2','https://192.168.1.3','https://192.168.1.5','https://192.168.1.6',
   'https://budget-client-407513.el.r.appspot.com', 'https://glaubhanta.site','https://www.glaubhanta.site'
];
const options: cors.CorsOptions = {
   origin:  originsWhitelist ,
  credentials:true,
  methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH','OPTIONS']
}
 /*type issue not working
var corsOptions = {
  origin: function(origin: string, callback: any){
        var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
        callback(null, isWhitelisted);
  },
  credentials:true,
  methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
}*/
const crsOpt = cors(options);
app.options('*',crsOpt); // for pre-flight request for delete request's
app.use(crsOpt);
app.all('*', function(req: Request,  res: Response, next: NextFunction) {

        const origin :string = req.headers.origin !=undefined ? req.headers.origin :( req.headers.host !=undefined ? req.headers.host  :"") ;
        console.log("req.headers "+JSON.stringify(req.headers));
        let validReqOrigin = false;
        originsWhitelist.forEach((validHost, index) => {
            if(validHost.indexOf(origin) >-1){
              validReqOrigin = true;
            }
        });
        if(validReqOrigin) {
	   res.header("Access-Control-Allow-Origin",origin);
           console.log("CORS allowed "+origin);
	  // console.log("CORS request body "+JSON.stringify(req['body']));
        }
        else { console.log("CORS not allowed "+origin);
	 }
        res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
	next();
    });

// app.use(csrf());
// app.use(csrfCookieSetter());
app.use(errorHandler());
app.use(logger.initialize());
app.use(routes);
// app.get('*', serveIndex());
/*httpsServer.listen(8080, ip || 'localhost'  , () => {
  console.log("The HTTP SSL server started on port 8080");
});*/
httpServer.listen( () => {
  console.log("The HTTP  server started ");
});
// app.listen(8080, ip || 'localhost' ,() => logger.info('main.app_start'));