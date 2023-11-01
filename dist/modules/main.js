"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readProtocolTable = exports.readNodesTable = exports.readUsersTable = void 0;
/**
 *
 * @returns {Promise}
 */
const readUsersTable = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield User.getAll();
        if (!data.length)
            return Promise.reject(0);
        let caArray = [];
        data.forEach((user) => caArray.push(Buffer.from(user.cert))); // check exception
        store.ca = caArray;
        store.users = data;
        emit("users", data);
        return data;
    }
    catch (err) {
        return Promise.reject(err);
    }
});
exports.readUsersTable = readUsersTable;
/**
 *
 * @returns {Promise}
 */
const readNodesTable = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield Node.getAll();
        if (!data.length)
            return Promise.reject(0);
        store.nodes = data;
        // const currentNode = store.nodes.find(node => node.node_id === store.node.id);
        // if (currentNode) {
        // 	store.node.public_ipv4 = currentNode.public_ipv4;
        // } else {
        // 	logger.warn("store", "OWN NODE NOT FOUND", store.node);
        // }
        emit("nodes", store.nodes);
        return data;
    }
    catch (err) {
        return Promise.reject(err);
    }
});
exports.readNodesTable = readNodesTable;
/**
 * @returns {Promise}
 */
const readProtocolTable = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield Protocol.getAll();
        let protocol = {};
        for (const key in PROTOCOL) {
            const item = data.find((obj) => obj.name === key);
            const value = !!item ? item.value || 0 : 0;
            protocol[key] = value;
            emit("protocol-" + key, value);
        }
        return protocol;
    }
    catch (err) {
        return Promise.reject(err);
    }
});
exports.readProtocolTable = readProtocolTable;
const defaults = {
    router: DEFAULTS.ROUTER,
    bootstrap: DHTPERM.ONLY_FRIENDS,
    dhtLookup: DHTPERM.ONLY_FRIENDS,
    dhtAnnounce: DHTPERM.ONLY_FRIENDS,
    external: DEFAULTS.EXTERNAL,
    autoDefine: DEFAULTS.AUTO_DEFINE_IP,
    public_ipv4: "",
};
subscribe(["master-key", "node-key", "config-db", "protocol-db"], (_action, _value, _type) => {
    if (state["config-db"] >= STATES.LIMITED)
        return; // don't trigger when status is loaded
    if (state["protocol-db"] < STATES.FULL)
        return;
    readConfigTable()
        .then((_result) => {
        emit("config-db", STATES.FULL);
    })
        .catch((err) => {
        if (args.auto) {
            logger.info("STORE", "Creating config table in automatic mode");
            cconfig(defaults);
        }
        else {
            emit("config-db", STATES.ERROR); // check
            logger.log("store", "read config db error::", err);
        }
    });
});
subscribe(["master-key", "node-key", "users-db", "protocol-db"], (action, value, type) => {
    // check
    if (state["users-db"] >= STATES.LIMITED)
        return; // don't trigger when status is loaded
    if (state["protocol-db"] < STATES.FULL)
        return;
    (0, exports.readUsersTable)()
        .then((_result) => {
        emit("users-db", STATES.FULL);
    })
        .catch((err) => {
        if (args.auto) {
            logger.info("STORE", "Creating users table in automatic mode");
            cusers(store);
        }
        else {
            emit("users-db", STATES.ERROR); // check
            logger.log("store", "read users db error::", err);
        }
    });
});
subscribe(["master-key", "node-key", "nodes-db", "protocol-db"], (_action, status) => {
    if (state["nodes-db"] >= STATES.LIMITED)
        return; // don't trigger when status is loaded
    if (state["protocol-db"] < STATES.FULL)
        return;
    (0, exports.readNodesTable)()
        .then((result) => {
        emit("nodes-db", STATES.FULL);
    })
        .catch((err) => {
        if (args.auto) {
            logger.info("STORE", "Creating nodes table in automatic mode");
            cnodes(store, defaults);
        }
        else {
            emit("nodes-db", STATES.ERROR); // check
            logger.log("store", "read nodes db error::", err);
        }
    });
});
subscribe(["config-db", "users-db", "nodes-db"], () => {
    const arr = [state["config-db"], state["users-db"], state["nodes-db"]];
    arr.sort((a, b) => {
        return a > b;
    });
    services.database = arr[0]; // min value
});
// INIT POINT
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield checkHomeDir();
        yield initPersistDbs();
        getKeys();
    }
    catch (err) {
        logger.error("store.js", "init", err);
    }
});
init();