# GraphQL literal schema with resolvers

[![npm version](https://img.shields.io/npm/v/literal-schema.svg?style=flat-square)](https://www.npmjs.com/package/literal-schema)
[![bundlephobia](https://badgen.net/bundlephobia/minzip/literal-schema@latest)](https://bundlephobia.com/result?p=literal-schema)
[![License](https://img.shields.io/npm/l/literal-schema.svg)](https://github.com/sebas5384/literal-schema/blob/master/package.json)
[![coverage](https://img.shields.io/codecov/c/github/sebas5384/literal-schema.svg?style=flat-square)](https://codecov.io/github/sebas5384/literal-schema)

## Motivation

Inspired on [code-first vs. schema-first](https://www.prisma.io/blog/the-problems-of-schema-first-graphql-development-x1mn4cb0tyl3/) discussions and [styled-components](https://www.styled-components.com/) which use template literals string to insert functions into css expressions, I decided to try out the same approach to bind resolver functions to a field of a definition type.

## How to use

### Install

```
npm install literal-schema
```

or

```
yarn add literal-schema
```

### Example

Using Apollo Server

```js
import { ApolloServer } from 'apollo-server'
import toAST from 'graphql-tag'
import { withAST } from 'schema-literal'

import cmsApi from './lib/cmsApi'

// (optional) Compose with graphql-tag in order to compile typeDefs to AST.
const gql = withAST(toAST)

const schema = gql`
  type Article {
    id: ID!
    title: String!

    isPublished: Boolean!
    ${({ workflow }) => workflow.some(status => status === 'public')}

    tags: [String!]!
    ${({ id }, args, context) => context.cmsApi.getTagsByContent(id)}
  }

  type User {
    id: ID!
    name: String!

    articles: [Article!]!
    ${({ id }, args, context) => context.cmsApi.getArticlesByUser(id)}
  }

  extend type Query {
    users(page: Number): [User]!
    ${(_, { page = 1 }, context) => context.cmsApi.getUsers({ page })}

    articles(page: Number): [Article]!
    ${(_, { page = 1 }, context) => context.cmsApi.getArticles({ page })}
  }
`

// Injects `cmsApi` in the context.
const context = { cmsApi }

// `schema` has the shape `{ resolvers, typeDefs }` which is compatible with ApolloServer config object.
const server = new ApolloServer({ ...schema, context })

server.listen(process.env.PORT || 3000).then(({ url }) => {
  console.log(`🚀 Server eready at ${url}`)
})
```

## Confessions

This lib is **experimental** and I'm just having fun here, though it has 100% of test coverage and you could actually use it, this pattern is not tested in the wild, so be careful.

**Contributions are very welcome :)**

> Lib created with [Javali](https://javali.js.org)
