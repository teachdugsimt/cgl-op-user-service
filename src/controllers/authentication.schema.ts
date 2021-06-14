import { FastifySchema } from "fastify";

export const otpRequestSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      countryCode: { type: 'string' },
      phoneNumber: { type: 'string' },
      userType: { type: 'number' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        refCode: { type: 'string' },
        // otp: { type: 'string' }
      },
      additionalProperties: false
    }
  }
}

export const otpVerifySchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      countryCode: { type: 'string' },
      phoneNumber: { type: 'string' },
      variant: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        idToken: { type: 'string' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
      additionalProperties: false
    }
  }
}

export const refreshTokenSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      refreshToken: { type: 'string' },
      userId: { type: 'string' },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        idToken: { type: 'string' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
      additionalProperties: false
    }
  }
}

export const loginSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      password: { type: 'string' },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        idToken: { type: 'string' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
      additionalProperties: false
    }
  }
}

// export default {
//   otpRequestSchema,
// }
