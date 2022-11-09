const _ = require('lodash');
const dotEnv = require('dotEnv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// set dot config
dotEnv.config();

module.exports.createAuthToken = async (data) => {
    try {
        return jwt.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: '84d' });
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports.verifyUserAuth = async (req) => {
    try {
        if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
            const token = req.headers.authorization.split(" ")[1];
            const userDetails = jwt.verify(token, process.env.JWT_SECRET_KEY);
            return userDetails;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports.hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports.comparePassword = async (userPass, password) => {
    try {
        return await bcrypt.compare(password, userPass);
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports.encodeToBase64 = (data) => new Buffer.from(_.toString(data)).toString("base64");

module.exports.decodeFromBase64 = (data) => new Buffer.from(_.toString(data), "base64").toString("ascii");
