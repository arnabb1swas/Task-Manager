const _ = require('lodash');
const { skip } = require('graphql-resolvers');

const { db } = require('../../../database/util');

module.exports.isAuthenticated = (parent, args, context) => {
    try {
        const { jwtUser } = context;
        if (!jwtUser || !jwtUser.id) {
            throw new Error('Access denied! Please Login to continue.');
        }
        return skip;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

module.exports.isTaskCreator = async (parent, args, context) => {
    try {
        const { input: { id } } = args;
        const { jwtUser } = context;
        const task = await db.select('*').from("public.task").where("id", id).first();

        if (!task) {
            throw new Error('Task not Found!');
        } else if (jwtUser.id !== task.fk_user_id) {
            throw new Error('Unauthorized Task Creator!');
        }

        return skip;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
