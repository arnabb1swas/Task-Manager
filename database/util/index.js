const knex = require('knex');

const knexfile = require('./knexfile');

module.exports.db = knex(knexfile.development);
