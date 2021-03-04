'use strict';

global.datadir = require('os').homedir() + "/.dogma-node" + (process.env.PREFIX || "");

require("./modules/log");
require("./modules/temp");
require("./modules/dht");
require("./modules/own");
require("./modules/nodes");
const api = require("./modules/api");
const ee = require("./modules/eventEmitter");

module.exports.api = api;
module.exports.ee = ee;