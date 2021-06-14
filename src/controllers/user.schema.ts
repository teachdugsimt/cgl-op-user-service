import { FastifySchema } from "fastify";

export const termOfServiceSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      accept: { type: 'boolean' },
      version: { type: 'string' }
    }
  },
  params: {
    userId: { type: 'string' }
  },
  response: {
    200: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
}

export const getUserSchema: FastifySchema = {
  querystring: {
    descending: { type: 'boolean' },
    page: { type: 'number' },
    limit: { type: 'number' },
    name: { type: 'string' },
    phoneNumber: { type: 'string' },
    email: { type: 'string' },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        responseCode: { type: 'number' },
        data: { type: 'array' }
      },
      additionalProperties: false
    }
  }
}

export const getUserOwnerSchema: FastifySchema = {
  querystring: {
    userId: { type: 'string' }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        confirmationToken: { type: 'string' },
        fullname: { type: 'string' },
        phoneNumber: { type: 'string' },
        email: { type: 'string' },
        userType: { type: 'number' },
        enabled: { type: 'boolean' },
        avatar: { type: 'string' },
        deviceToken: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        createdBy: { type: 'string' },
        updatedBy: { type: 'string' },
        userId: { type: 'string' },
      },
      additionalProperties: false
    }
  }
}

export const updateUserOwnerSchema: FastifySchema = {
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' }
    },
    require: ['authorization']
  },
  body: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
      name: { type: 'string' },
      phoneNumber: { type: 'string' },
      email: { type: 'string' },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        responseCode: { type: 'number' },
        data: {}
      },
      additionalProperties: false
    }
  }
}

export const getUserByUserIdSchema: FastifySchema = {
  params: {
    userId: { type: 'string' }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        confirmationToken: { type: 'string' },
        fullname: { type: 'string' },
        phoneNumber: { type: 'string' },
        email: { type: 'string' },
        userType: { type: 'number' },
        enabled: { type: 'boolean' },
        avatar: { type: 'string' },
        deviceToken: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        createdBy: { type: 'string' },
        updatedBy: { type: 'string' },
        userId: { type: 'string' },
      },
      additionalProperties: false
    }
  }
}

export const updateUserByUserIdSchema: FastifySchema = {
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' }
    },
    require: ['authorization']
  },
  params: {
    userId: { type: 'string' }
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      phoneNumber: { type: 'string' },
      email: { type: 'string' },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        responseCode: { type: 'number' },
        data: {}
      },
      additionalProperties: false
    }
  }
}

export const addUserSchema: FastifySchema = {
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' }
    },
    require: ['authorization']
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      phoneNumber: { type: 'string' },
      email: { type: 'string' },
      userType: { type: 'number' }
    },
    require: ['name', 'phoneNumber']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        fullname: { type: 'string' },
        phoneNumber: { type: 'string' },
        email: { type: 'string' },
        userType: { type: 'number' }
      },
      additionalProperties: false
    }
  }
}

export const deleteUserByUserIdSchema: FastifySchema = {
  params: {
    userId: { type: 'string' }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        responseCode: { type: 'number' },
        data: {}
      },
      additionalProperties: false
    }
  }
}
