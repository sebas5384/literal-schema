import {
  extract,
  getFieldName,
  getTypeName,
  concatDefinitions,
  withAST
} from './main'

describe('extract resolvers', () => {
  it('should create resolver mapping like User.name and User.birthday', () => {
    const module = extract`
        type User {
          name: String!
          ${jest.fn()}
          birthdate: String
          ${jest.fn()}
        }
      `

    expect(module.resolvers.User).toBeDefined()
    expect(module.resolvers.User.name).toBeDefined()
    expect(module.resolvers.User.birthdate).toBeDefined()
  })

  it('should create resolver mapping like Content.title', () => {
    const module = extract`
        type Content {
          title: String!
          ${jest.fn()}
          created: String
        }
      `
    expect(module.resolvers.Content).toBeDefined()
    expect(module.resolvers.Content.title).toBeDefined()
  })

  it('should create resolver mapping when type is extended', () => {
    const module = extract`
        extend type Content {
          title: String!
          ${jest.fn()}
          created: String
        }

        extend type User {
          name: String!
          ${jest.fn()}
          created: String
        }
      `
    expect(module.resolvers.Content).toBeDefined()
    expect(module.resolvers.Content.title).toBeDefined()
    expect(module.resolvers.User).toBeDefined()
    expect(module.resolvers.User.name).toBeDefined()
  })

  it('should create resolver mapping with the right function resolvers', () => {
    const resolversSpy = {
      User: {
        name: jest.fn(),
        created: jest.fn()
      },
      Content: {
        title: jest.fn(),
        created: jest.fn()
      }
    }

    const module = extract`
        type User {
          id: ID!
          name: String!
          ${resolversSpy.User.name}
          created: String
          ${resolversSpy.User.created}
        }

        type Content {
          title: String!
          ${resolversSpy.Content.title}
          created: String
          ${resolversSpy.Content.created}
        }
      `

    module.resolvers.User.name()
    module.resolvers.User.created()
    module.resolvers.Content.title()
    module.resolvers.Content.created()

    expect(resolversSpy.User.name).toHaveBeenCalledTimes(1)
    expect(resolversSpy.User.created).toHaveBeenCalledTimes(1)
    expect(resolversSpy.Content.title).toHaveBeenCalledTimes(1)
    expect(resolversSpy.Content.created).toHaveBeenCalledTimes(1)
  })

  describe('resolver', () => {
    it('should be able to recieve arguments', () => {
      const resolversSpy = {
        User: {
          name: jest.fn()
        },
        Content: {
          created: jest.fn()
        }
      }

      const module = extract`
          type User {
            id: ID!
            name: String!
            ${resolversSpy.User.name}
          }

          type Content {
            title: String!
            created: String
            ${resolversSpy.Content.created}
          }
        `

      const userArgsMock = ['user root', ' user args', 'user context']
      module.resolvers.User.name(...userArgsMock)

      const contentArgsMock = [
        'content root',
        'content args',
        'content context'
      ]
      module.resolvers.Content.created(...contentArgsMock)

      expect(resolversSpy.User.name).toHaveBeenCalledWith(...userArgsMock)
      expect(resolversSpy.Content.created).toHaveBeenCalledWith(
        ...contentArgsMock
      )
    })
  })

  describe('helpers', () => {
    it('should get name of the field from a definition snippet', () => {
      const t = t => t
      const definitions = t`
          type Comment {
            title: String!
            body: String
          }

          type Content {
            title: String!
            ${jest.fn()}
            created: String
          }
        `
      expect(getFieldName(definitions[0])).toBe('title')
    })

    it('should create resolver mapping with each resolver function', () => {
      const t = t => t
      const definitions = t`
          type User {
            title: String!
            created: String
          }

          type Content {
            title: String!
            ${jest.fn()}
            created: String
            ${jest.fn()}
          }
        `
      expect(getTypeName(definitions[0])).toBe('Content')
      expect(getTypeName(definitions[1])).toBeNull()
    })
  })
})

describe('extract type definitions', () => {
  it('should return the concatenated schema definition', () => {
    const module = extract`
        extend type Content {
          title: String!
          ${jest.fn()}
          created: String
        }

        extend type User {
          name: String!
          ${jest.fn()}
          created: String
        }
      `

    const expectedSchema = `
        extend type Content {
          title: String!
          created: String
        }

        extend type User {
          name: String!
          created: String
        }
      `

    expect(module.typeDefs).toMatch(expectedSchema)
  })

  describe('concat schema', () => {
    it('should remove empty lines', () => {
      const t = t => t
      const definitions = t`
          type Comment {
            title: String!
            ${jest.fn()}
            body: String
            ${jest.fn()}
          }

          type Content {
            id: ID!
            title: String!
            ${jest.fn()}
            created: String
          }
        `

      const expectedSchema = `
          type Comment {
            title: String!
            body: String
          }

          type Content {
            id: ID!
            title: String!
            created: String
          }
        `

      expect(concatDefinitions(definitions)).toMatch(expectedSchema)
    })
  })
})

describe('withAST', () => {
  it('should execute toAST wrapper function', () => {
    const toAST = jest.fn(defs => defs)
    const gql = withAST(toAST)
    gql`
      type User {
        id: ID!
      }
    `
    expect(toAST).toHaveBeenCalledWith(`
      type User {
        id: ID!
      }
    `)
  })

  it('should return resolvers and AST as type definitions', () => {
    const gql = withAST(defs => defs)
    function userId() {}
    const { typeDefs, resolvers } = gql`
      type User {
        id: ID!
        ${userId}
        name: String!
      }
    `
    expect(typeDefs).toMatch(`
      type User {
        id: ID!
        name: String!
      }
    `)
    expect(resolvers.User.id.toString()).toBe('function userId() {}')
  })
})
