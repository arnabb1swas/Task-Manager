const _ = require('lodash');

const { createAuthToken, comparePassword, hashPassword, getPageInfo } = require('../../service/auth');
const {
    addUser,
    editUser,
    getUsers,
    removeUser,
    getUserById,
    getUserByEmail,
    getLoginUserDetails,
} = require('../../database/models');

module.exports = {
    Query: {
        users: async (parent, args, context) => {
            try {
                const { filter: { limit, hasDeleted = false, sortBy = 'ASC' }, cursor } = args;

                let users = await getUsers({ limit, hasDeleted, sortBy, cursor });
                if (!users) {
                    throw new Error("USER NOT FOUND");
                }

                const pageInfo = await getPageInfo({ obj: users, limit });

                return { userFeed: users, pageInfo };
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        user: async (parent, args, context) => {
            try {
                const { jwtUser: { id } } = context;

                const user = await getUserById({ id });
                if (!user) {
                    throw new Error("USER NOT FOUND");
                }

                return user;
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
    },

    Mutation: {
        signUp: async (parent, args, context) => {
            try {
                const { input: { name, email, password, role } } = args;

                const user = await getUserByEmail({ email });
                if (user) {
                    throw new Error("EMAIL ALREADY EXIST");
                }

                const hashedPassword = await hashPassword(password);
                const newUser = await addUser({ name, email, password: hashedPassword, role });
                const token = await createAuthToken({ id: newUser.id, role: newUser.role });

                return { token, user: newUser };
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        logIn: async (parent, args, context) => {
            try {
                const { input: { email, password } } = args;

                const user = await getLoginUserDetails({ email });

                if (!user) {
                    throw new Error("USER NOT FOUND");
                }

                const validPassword = await comparePassword(user.password, password);

                if (!validPassword) {
                    throw new Error("INCORRECT PASSWORD");
                }

                const token = await createAuthToken({ id: user.id, role: user.role });

                return { token, user };
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        updateUser: async (parent, args, context) => {
            try {
                const { input: { name, email, password } } = args;
                const { jwtUser: { id } } = context;

                const updatedUser = await editUser({ id, name, email, password });

                return updatedUser;
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
        deleteUser: async (parent, args, context) => {
            try {
                const { jwtUser: { id } } = context;
                const deletedUser = await removeUser({ id });

                return deletedUser;
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
    },

    User: {
        id: (parent, args, context) => parent.id,
        name: (parent, args, context) => parent.name,
        email: (parent, args, context) => parent.email,
        tasks: async (parent, args, context) => {
            try {
                const { id } = parent;
                const { loaders: { batchTask, batchUserTasksId } } = context;
                let tasks = [];

                const userTaskIds = await batchUserTasksId.load(id);
                if (!_.isEmpty(userTaskIds)) {
                    const taskIds = _.map(userTaskIds, task => task.id);
                    tasks = await batchTask.loadMany(taskIds);
                }

                return tasks;
            } catch (error) {
                console.log(error);
                throw error;
            }
        },
    }
};
