'use strict';

const crypt = require("./crypt");
const createDataBase = require("./routines/createDataBase");
const store = require("./store");
const model = require("./model");
const { sendToNode } = require("./connection");
const generateMasterKeys = require("./routines/generateMasterKeys");
const generateNodeKeys = require("./routines/generateNodeKeys");
const { services } = require("./state");
const c = require("./constants");

/**
 * 
 * @param {Number} code 
 * @param {*} data 
 */
const response = (code, data) => {
	code = Number(code) || 0;
	data = data || null;
	return {
		code,
		data
	}
}


const getFriends = (store) => { // edit
	if (!store || !store.nodes || !store.users) console.warn("empty store");
	var object = [];
	var usersKeys = {};
	object = store.users.map((user, i) => {
		delete user.cert;
		user.nodes = [];
		usersKeys[user.hash] = i;
		return user;
	});
	store.nodes.forEach((node) => {
		const uh = node.user_hash;
		if (usersKeys[uh] !== undefined) {
			const i = usersKeys[uh];
			object[i].nodes.push({
				name: node.name,
				hash: node.hash,
				online: true
			});
		}
	});
	
	object.map(item => {
		const online = item.nodes.filter(x => !!x.online);
		item.onlineCount = online.length;
		return item;
	});
	return object;
}

module.exports.certificate = { 
	/**
	 * @returns {Object} result
	 */
	get: async () => { 
		try {
			const result = await crypt.getDogmaCertificate(); 
			return response(c.OK, result);
		} catch (err) { 
			console.error("certificate", "get", err);
			return response(c.CANNOTGETCERT, err);
		}
	},
	set: () => {
		console.log("nothing to do");
	},
	/**
	 * 
	 * @param {String} cert b64
	 * @returns {Object} result
	 */
	push: async (cert) => { 
		const parsed = crypt.validateDogmaCertificate(cert);
		if (parsed.result) {
			const result = await crypt.addDogmaCertificate(parsed); 
			if (result) {
				return response(c.OK, result)
			} else {
				return response(c.ADDCERTERROR); // add message
			}
		} else {
			return response(c.INVALIDCERT, parsed.error);
		}
	}
}


module.exports.database = {
	get: () => {

	},
	/**
	 * 
	 * @param {Object} defaults  router, bootstrap, dhtLookup, dhtAnnounce, external, autoDefine, ip4, stun, turn
	 * @returns {Object} result
	 */
	set: async (defaults) => { 
		try {
			const result = await createDataBase(defaults);
			return response(c.OK, result);
		} catch (err) {
			console.error(err);
			return response(c.CREATEDBERROR, err); // edit
		}
	}
}


module.exports.config = {
	get: () => {
		try {
			const result = store.config;
			return response(c.OK, result);
		} catch (err) { 
			console.error(err);
			return response(c.GETCONFIGERROR, err);
		}
	},
	/**
	 * 
	 * @param {Object} data 
	 * @returns {Object} result
	 */
	set: async (data) => { // edit !!!
		try {
			const newObject = Object.keys(data).map((key) => {
				return {
					param: key,
					value: data[key]
				}
			});
			const result = await model.persist("config", newObject); // edit
			return response(c.OK, result);
		} catch (err) {
			console.error(err);
			return response(c.CONFIGSAVEERROR, err);
		}
	}
}

module.exports.directMessages = {
	/**
	 * 
	 * @param {Object} params 
	 * @returns {Array}
	 */
	get: async (params) => { // edit
		try {
			const result = await global.temp.all("SELECT * FROM dm WHERE time > ? AND device_id = ?", [params.since, params.hash]);
			return response(c.OK, result);
		} catch (err) { 
			console.error(err);
			return response(c.CANNOTGETDM, err);
		}
	},
	/**
	 * 
	 * @param {Object} data to, message
	 */
	push: async (data) => { // add error message
		const result = await sendToNode(data.to, data.message);
		return response(c.OK, result);
	}
}

module.exports.friends = { // edit
	get: () => {
		try {
			const result = getFriends(store);
			return response(c.OK, result);
		} catch (err) {
			return response(c.CANNOTGETFRIENDS, err);	
		}
	},
	set: () => {
		console.log("do nothing");
	}
}

module.exports.masterKey = {
	get: () => {

	},
	/**
	 * 
	 * @param {Object} params 
	 */
	set: (params) => { 
		const result = generateMasterKeys(store, params);
		if (result.result) {
			return response(c.OK);
		} else {
			return response(c.CANNOTCREATEMK, result.error);	
		}
	}
} 

module.exports.nodeKey = {
	get: () => {

	},
	/**
	 * 
	 * @param {Object} params 
	 */
	set: (params) => {
		const result = generateNodeKeys(store, params);
		if (result.result) {
			return response(c.OK);
		} else {
			return response(c.CANNOTCREATENK, result.error);	
		}
	}
}

module.exports.services = {
	/**
	 * @returns {Object}
	 */
	get: () => {
		try {
			const result = JSON.parse(JSON.stringify(services));
			return response(c.OK, result);
		} catch (err) {
			console.error(err);
			return response(c.CANNOTGETSERVICES, err);
		}
	},
	set: () => {

	}
}