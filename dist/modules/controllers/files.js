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
const fs = require("fs");
const fsAsync = require("fs").promises;
const logger = require("../../logger");
const { File } = require("../model");
const EventEmitter = require("../eventEmitter");
const { datadir } = require("../datadir");
const { DIRECTION, MESSAGES } = require("../constants");
const generateSyncId = require("../generateSyncId");
/** @module FilesController */
const files = module.exports = {
    sendChunksize: 100000,
    write: {},
    downloadProgress: {},
    uploadProgress: {},
    /**
     *
     * @param {Object} params
     * @param {String} params.to
     * @param {Number} params.type
     * @param {Number} params.descriptor check
     * @param {String} params.title
     * @param {Number} params.size check
     */
    permitFileDownload({ to, type, descriptor, title, size }) {
        return new Promise((resolve, reject) => {
            try {
                const destination = datadir + "/download/" + title;
                const stream = fs.createWriteStream(destination); // add stream closing
                const object = {
                    stream,
                    title,
                    size,
                    downloaded: 0,
                    to,
                    type
                };
                files.write[descriptor] = object;
                stream.on("open", (_fd) => { resolve(true); }); // edit
                stream.on("close", () => { logger.info("files.js", "write stream for", descriptor, "closed"); });
                stream.on("finish", () => logger.info("files.js", "writable stream finished", descriptor));
                // resolve(true);
            }
            catch (err) {
                reject(err);
            }
        });
    },
    /**
     *
     * @param {Object} params
     * @param {String} user_id
     * @param {Object} file
     * @param {String} file.name
     * @param {Number} file.size
     * @param {String} file.type
     * @param {String} file.pathname optional
     * @param {String} file.data optional
     * @returns {Promise}
     */
    permitFileTransfer({ user_id, file }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, size, type, pathname, data } = file;
                const descriptor = this.getFileDescriptor();
                if (!!pathname && !data) {
                    file.descriptor = descriptor;
                    yield File.permitFileTransfer({ user_id, file });
                    return { descriptor, pathname };
                }
                else if (!pathname && !!data) {
                    const regex = /^data:.+\/(.+);base64,(.*)$/;
                    const matches = data.match(regex);
                    const destination = datadir + "/temp/" + name;
                    const fileData = Buffer.from(matches[2], "base64");
                    yield fsAsync.writeFile(destination, fileData);
                    const tmpFile = {
                        descriptor,
                        size,
                        pathname: destination
                    };
                    yield File.permitFileTransfer({ user_id, file: tmpFile });
                    return { descriptor, pathname: destination };
                }
                else {
                    return Promise.reject("undefined data and pathname");
                }
            }
            catch (err) {
                return Promise.reject(err);
            }
        });
    },
    forbidFileUpload({ descriptor }) {
    },
    /**
     *
     * @param {Object} params
     * @param {String} params.node_id
     * @param {String} params.user_id
     * @param {Number} params.descriptor
     */
    sendFile({ node_id, user_id, descriptor }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const value = yield File.fileTransferAllowed({ user_id, descriptor });
                if (!value)
                    return logger.warn("files.js", "sendFile", "not allowed for", user_id);
                const connection = require("../connection"); // edit
                const channel = yield connection.streamToNode({ node_id, descriptor }); // edit
                let size, stream;
                let uploaded = 0;
                const fileInfo = fs.statSync(value.pathname);
                size = fileInfo.size;
                stream = fs.createReadStream(value.pathname, {
                    highWaterMark: files.sendChunksize
                });
                stream.on("close", () => {
                    logger.info("files.js", "readable stream closed", descriptor);
                });
                stream.on("end", () => {
                    logger.info("files.js", "readable stream ended", descriptor);
                });
                stream.on("data", (data) => {
                    uploaded += data.length;
                    const progress = uploaded / size;
                    channel.write(data);
                    if (progress === 1)
                        channel.end();
                    const progressValue = progress.toFixed(2);
                    if (files.uploadProgress[descriptor] === progressValue)
                        return;
                    files.uploadProgress[descriptor] = progressValue;
                    EventEmitter.emit("file-transfer", {
                        progress: progressValue,
                        direction: DIRECTION.OUTCOMING,
                        descriptor,
                        user_id,
                        node_id
                    });
                });
            }
            catch (err) {
                logger.error("files.js", "sendFile", err);
            }
        });
    },
    /**
     *
    * @param {Object} params
    * @param {String} params.node_id
    * @param {String} params.user_id
    * @param {Object} params.request
    * @param {String} params.request.type
    * @param {String} params.request.action
    * @param {Object} params.request.data
     */
    handleRequest({ node_id, user_id, request }) {
        const { data: { descriptor } } = request;
        if (!descriptor)
            return logger.warn("files.js", "unknown file descriptor");
        switch (request.action) {
            case "download":
                files.sendFile({ node_id, user_id, descriptor });
                break;
        }
    },
    /**
     *
     * @param {Object} params
     * @param {Number} params.descriptor
     * @param {Buffer} params.decodedData check
     * @param {String} params.node_id
     * @param {String} params.user_id
     */
    handleFile({ descriptor, decodedData, node_id, user_id }) {
        if (!files.write[descriptor])
            return logger.warn("files.js", "this file didn't expected");
        let object = files.write[descriptor];
        const { to, type } = object;
        switch (type) {
            case MESSAGES.DIRECT:
                if (to !== node_id)
                    return logger.warn("files.js", node_id, "not allowed");
                break;
            case MESSAGES.USER:
                if (to !== user_id)
                    return logger.warn("files.js", user_id, "not allowed");
                break;
            default:
                return logger.warn("files.js", "CHAT TRANSFER", "not allowed");
                break;
        }
        object.downloaded += decodedData.length;
        if (object.downloaded > object.size) {
            object.stream && object.stream.end();
            return logger.warn("files.js", "can't write more than expected");
        }
        object.stream.write(decodedData);
        const progress = object.downloaded / object.size;
        if (progress === 1)
            object.stream.end();
        const progressValue = progress.toFixed(2);
        if (files.downloadProgress[descriptor] === progressValue)
            return;
        files.downloadProgress[descriptor] = progressValue;
        EventEmitter.emit("file-transfer", {
            progress: progressValue,
            direction: DIRECTION.INCOMING,
            descriptor,
            user_id,
            node_id
        });
    },
    /**
     *
     * @returns {String} descriptor size:15
     */
    getFileDescriptor() {
        return generateSyncId(5);
    }
};