const { skip } = require('graphql-resolvers');

const { getUserById, getTaskById } = require('../../../database/models');

module.exports.isAuthenticated = async (parent, args, context) => {
    try {
        const { jwtUser } = context;
        if (!jwtUser || !jwtUser.id) {
            throw new Error('ACCESS DENIED! LOGIN TO CONTINUE');
        }

        const user = await getUserById({ id: jwtUser.id });
        if (!user) {
            throw new Error("USER NOT FOUND");
        }

        return skip;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

module.exports.isAdmin = (parent, args, context) => {
    try {
        const { jwtUser: { role } } = context;
        if (role !== 'ADMIN') {
            throw new Error('USER IS NOT AN ADMIN');
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
        const task = await getTaskById({ id });

        if (!task) {
            throw new Error('TASK NOT FOUND');
        } else if (jwtUser.id !== task.fk_user_id) {
            throw new Error('UNAUTHORIZED TASK CREATOR');
        }

        return skip;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
