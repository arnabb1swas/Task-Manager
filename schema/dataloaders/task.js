const { db } = require('../../database/util');

module.exports.batchTasks = async (keys) => {
    keys = keys.map(Number);
    const tasks = await db("public.task").select("*").whereIn("id", keys);
    return keys.map(key => tasks.find(task => task.id === key));
};