const { db } = require('../../database/util');

module.exports.batchTasks = async (keys) => {
    try {
        keys = keys.map(Number);
        const tasks = await db("public.task").select("*").whereIn("id", keys);
        return keys.map(key => tasks.find(task => task.id === key));
    } catch (error) {
        console.log(error);
        throw error;
    }
};
