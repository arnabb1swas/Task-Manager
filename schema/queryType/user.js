const { gql } = require('apollo-server-express');

module.exports = gql`
    extend type Query {
        users: [User!]
        user: User
    }

    extend type Mutation {
        signUp(input: SignUpInput!): UserToken!
        logIn(input: LoginInput!): UserToken!
        updateUser(input: UpdateUserInput!): User!
        deleteUser: Boolean!
    }

    enum USER_ROLE_ENUM {
        USER
        ADMIN
    }

    type User {
        id: Int!
        name: String!
        email: String!
        tasks: [Task!]
    }

    input SignUpInput {
        name: String!
        email: String!
        password: String!
        role: USER_ROLE_ENUM!
    }

    input LoginInput {
        email: String!
        password: String!
    }

    type UserToken {
        user: User!
        token: String!
    }

    input UpdateUserInput {
        name: String
        email: String
        password: String
        # role: USER_ROLE_ENUM
    }
`;
