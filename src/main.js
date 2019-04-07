export const extract = (definitions, ...resolvers) => {
  const binded = resolvers.reduce(
    (acc, nextResolver, key) => {
      const fieldName = getFieldName(definitions[key])
      const typeName = getTypeName(definitions[key]) || acc.lastTypeName

      const extendFields = acc.resolvers[typeName] || {}
      const resolvers = {
        ...acc.resolvers,
        [typeName]: { ...extendFields, [fieldName]: nextResolver }
      }

      return { resolvers, lastTypeName: typeName }
    },
    { resolvers: {}, lastTypeName: null }
  )

  return {
    resolvers: binded.resolvers || {},
    typeDefs: concatDefinitions(definitions)
  }
}

export const getFieldName = definition => {
  const raw = definition.match(/[^\s].+[\s\n:]+$/)
  // @TODO deal when there's no match.
  return (
    raw &&
    raw
      .toString()
      .trim()
      .match(/^(.+):/)
      .pop()
  )
}

export const getTypeName = definition => {
  const raw = definition.match(/type\s?.*\s?\{/g)
  // @TODO deal when there's no match.

  return (
    raw &&
    raw
      .pop()
      .match(/[^type\s]\S+[^\s?{^]/)
      .toString()
  )
}

export const concatDefinitions = definitions =>
  definitions.join('').replace(/^\s+$(?:\e\n?|\n)/gm, '')

export const withAST = toAST => (...args) => {
  const { resolvers, typeDefs } = extract(...args)
  return { resolvers, typeDefs: toAST(typeDefs) }
}
