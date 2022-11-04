const knex = require('knex');
const dotEnv = require('dotenv');

dotEnv.config();

const knexfile = require('./knexfile');

module.exports.db = knex(knexfile.development);
