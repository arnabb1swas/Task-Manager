const { db } = require('../../database/util');

module.exports.batchUsers = async (keys) => {
    keys = keys.map(Number);
    const users = await db("public.User").select("*").whereIn("id", keys);
    return keys.map(key => users.find(user => user.id === key));
};
