"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("../modules/server"));
const connections_1 = __importDefault(require("./connections"));
const state_1 = __importDefault(require("./state"));
const storage_1 = __importDefault(require("./storage"));
const Types = __importStar(require("../types"));
const logger_1 = __importDefault(require("../modules/logger"));
// import connectionTester from "../modules/connectionTester";
const server = new server_1.default({ connections: connections_1.default, storage: storage_1.default, state: state_1.default });
state_1.default.subscribe(["SERVER" /* Types.Event.Type.server */], (value) => {
    state_1.default.services.router = value;
});
state_1.default.subscribe([
    "SERVER" /* Types.Event.Type.server */,
    "CONFIG AUTO DEFINE" /* Types.Event.Type.configAutoDefine */,
    "CONFIG EXTERNAL" /* Types.Event.Type.configExternal */,
    "CONFIG PUBLIC IPV4" /* Types.Event.Type.configPublicIpV4 */,
], (_action, _state) => {
    const state = state_1.default.services.router;
    switch (state) {
        case 5 /* Types.System.States.limited */:
            // connectionTester();
            break;
        case 7 /* Types.System.States.full */:
            state_1.default.emit("EXTERNAL PORT" /* Types.Event.Type.externalPort */, state_1.default.state["CONFIG ROUTER" /* Types.Event.Type.configRouter */]);
            break;
    }
});
state_1.default.subscribe([
    "CONFIG ROUTER" /* Types.Event.Type.configRouter */,
    "NODE KEY" /* Types.Event.Type.nodeKey */,
    "MASTER KEY" /* Types.Event.Type.masterKey */,
], () => {
    logger_1.default.log("DEBUG", "Server start");
    const port = state_1.default.state["CONFIG ROUTER" /* Types.Event.Type.configRouter */];
    // edit
    if (!state_1.default.services.router) {
        server.listen(port);
    }
    else {
        server.refresh(port);
    }
});