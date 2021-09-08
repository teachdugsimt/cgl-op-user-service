import { FastifySchema } from "fastify";

export const otpRequestSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      countryCode: { type: 'string' },
      phoneNumber: { type: 'string' },
      // userType: { type: 'number' }
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
        message: { type: 'string' },
        responseCode: { type: 'number' },
        userProfile: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            userId: { type: 'string' },
            companyName: { type: 'string' },
            fullName: { type: 'string' },
            mobileNo: { type: 'string' },
            email: { type: 'string' },
            userType: { type: 'string' },
            avatar: { type: 'string' },
            attachCodeCitizenId: { type: 'string' },
            documentStatus: { type: 'string' },
          }
        },
        token: {
          type: 'object',
          properties: {
            idToken: { type: 'string' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          }
        },
        termOfService: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            accepted: { type: 'boolean' },
            data: { type: 'string' }
          }
        }
      },
      additionalProperties: true
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
      additionalProperties: true
    }
  }
}

// export default {
//   otpRequestSchema,
// }
