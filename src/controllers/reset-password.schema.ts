import { FastifySchema } from "fastify";

export const validateToken: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      token: { type: 'string' }
    },
    require: ['token']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      additionalProperties: false
    }
  }
}

export const resetRequest: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string' }
    },
    require: ['email']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        alreadySent: { type: 'boolean' },
      },
      additionalProperties: false
    }
  }
}

export const resetConfirm: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      token: { type: 'string' },
      password: { type: 'string' },
      confirmPassword: { type: 'string' }
    },
    require: ['token', 'password', 'confirmPassword']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      additionalProperties: false
    }
  }
}
