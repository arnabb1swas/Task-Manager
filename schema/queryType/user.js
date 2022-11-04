const { gql } = require('apollo-server-express');

module.exports = gql`
   extend type Query {
        users: [User!]
        user: User
    }

   extend type Mutation {
        signUp(input: signUpInput!): User!
        logIn(input: loginInput!): Token!
        updateUser(input: updateUserInput!): User!
        deleteUser: Boolean!
    }

    type User {
        id: ID!
        name: String!
        email: String!
        tasks: [Task!]
    }

    input signUpInput {
        name: String!
        email: String!
        password: String!
    }

    input loginInput {
        email: String!
        password: String!
    }

    type Token {
        token: String!
    }

    input updateUserInput {
        name: String
        email: String
        password: String
    }
`;
