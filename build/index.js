"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const cors = require("cors");
const morgan = require("morgan");
const express_1 = tslib_1.__importDefault(require("express"));
const session = require("express-session");
const passport_1 = tslib_1.__importDefault(require("./app/auth/passport"));
const routes_1 = tslib_1.__importDefault(require("./routes"));
const config_1 = tslib_1.__importDefault(require("./config"));
const error_handler_1 = tslib_1.__importDefault(require("./utils/error-handler"));
const logger_1 = tslib_1.__importDefault(require("./utils/logger"));
const fs = require("fs");
const https = require("https");
const path = require("path");
require("localstorage-polyfill");
global.localStorage = localStorage;
console.log("ssl at : " + path.resolve(__dirname, '../ssl.key/serveractual.key'));
if (typeof localStorage === "undefined" || localStorage === null) {
    const LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}
localStorage.setItem('myFirstKey', 'myFirstValue');
console.log(localStorage.getItem('myFirstKey'));
const privateKey = fs.readFileSync(path.resolve(__dirname, '../ssl.key/serveractual.key'), 'utf8');
const certificate = fs.readFileSync(path.resolve(__dirname, '../ssl.crt/serveractual.crt'), 'utf8');
const credentials = { key: privateKey, cert: certificate };
const app = express_1.default();
const httpsServer = https.createServer(credentials, app);
const ip = '0.0.0.0';
app.use(session(config_1.default.sessionConfig));
app.use(morgan(config_1.default.morganPattern, { stream: config_1.default.morganStream }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(passport_1.default.initialize());
const originsWhitelist = [
    'https://192.168.1.4:8000', 'https://192.168.1.4:8080',
    'https://192.168.1.7', 'https://192.168.1.2', 'https://192.168.1.3', 'https://192.168.1.5', 'https://192.168.1.6',
    'https://budget-client-407513.el.r.appspot.com', 'https://glaubhanta.site', 'https://www.glaubhanta.site'
];
const options = {
    origin: originsWhitelist,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH', 'OPTIONS']
};
const crsOpt = cors(options);
app.options('*', crsOpt);
app.use(crsOpt);
app.all('*', function (req, res, next) {
    const origin = req.headers.origin != undefined ? req.headers.origin : (req.headers.host != undefined ? req.headers.host : "");
    console.log("req.headers " + JSON.stringify(req.headers));
    let validReqOrigin = false;
    originsWhitelist.forEach((validHost, index) => {
        if (validHost.indexOf(origin) > -1) {
            validReqOrigin = true;
        }
    });
    if (validReqOrigin) {
        res.header("Access-Control-Allow-Origin", origin);
        console.log("CORS allowed " + origin);
    }
    else {
        console.log("CORS not allowed " + origin);
    }
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(error_handler_1.default());
app.use(logger_1.default.initialize());
app.use(routes_1.default);
httpsServer.listen(8080, ip || 'localhost', () => {
    console.log("The HTTP SSL server started on port 8080");
});