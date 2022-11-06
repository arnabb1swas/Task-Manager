const { db } = require('../../database/util');

module.exports.batchUsers = async (keys) => {
    try {
        keys = keys.map(Number);
        const users = await db("public.user").select("*").whereIn("id", keys);
        return keys.map(key => users.find(user => user.id === key));
    } catch (error) {
        console.log(error);
        throw error;
    }
};
