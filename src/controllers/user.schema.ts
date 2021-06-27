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
    rowsPerPage: { type: 'number' },
    fullName: { type: 'string' },
    phoneNumber: { type: 'string' },
    email: { type: 'string' },
    sortBy: {
      type: 'string',
      enum: ['id', 'email', 'fullName', 'phoneNumber']
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        size: { type: 'number' },
        currentPage: { type: 'number' },
        totalPages: { type: 'number' },
        totalElements: { type: 'number' },
        numberOfElements: { type: 'number' },
      },
      additionalProperties: false
    }
  }
}

export const getUserOwnerSchema: FastifySchema = {
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' }
    },
    require: ['authorization']
  },
  querystring: {
    userId: { type: 'string' }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        confirmationToken: { type: 'string' },
        fullName: { type: 'string' },
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
        status: { type: 'string' },
        documentStatus: { type: 'string' },
        legalType: { type: 'string' },
        files: { type: 'array', items: { type: 'string' } }
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
      fullName: { type: 'string' },
      phoneNumber: { type: 'string' },
      email: { type: 'string' },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        confirmationToken: { type: 'string' },
        fullName: { type: 'string' },
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
        files: { type: 'array', items: { type: 'string' } }
      },
      additionalProperties: false
    }
  }
} // 58.137.230.146

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
        fullName: { type: 'string' },
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
        status: { type: 'string' },
        documentStatus: { type: 'string' },
        legalType: { type: 'string' },
        files: { type: 'array', items: { type: 'string' } }
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
      fullName: { type: 'string' },
      phoneNumber: { type: 'string' },
      email: { type: 'string' },
      legalType: {
        type: 'string',
        enum: ['INDIVIDUAL', 'JURISTIC']
      },
      attachCode: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        confirmationToken: { type: 'string' },
        fullName: { type: 'string' },
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
        files: { type: 'array', items: { type: 'string' } }
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
      fullName: { type: 'string' },
      phoneNumber: { type: 'string' },
      email: { type: 'string' },
      userType: { type: 'number' },
      legalType: {
        type: 'string',
        enum: ['INDIVIDUAL', 'JURISTIC']
      },
      attachCode: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    },
    require: ['fullName', 'phoneNumber']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        fullName: { type: 'string' },
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

export const generateUploadLinkResponse: FastifySchema = {
  // body: {},
  params: {
    userId: { type: 'string' }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        url: { type: 'string', nullable: true },
        userId: { type: 'string', nullable: true },
      },
      additionalProperties: false
    }
  }
}

export const deleteUploadLinkResponse: FastifySchema = {
  // body: {},
  params: {
    userId: { type: 'string' }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: { type: 'boolean' }
      },
      additionalProperties: false
    }
  }
}

export const updateUserProfileResponse: FastifySchema = {
  // body: {},
  params: {
    userId: { type: 'string' }
  },
  body: {
    type: 'object',
    properties: {
      token: { type: 'string' },
      url: { type: 'array', items: { type: 'string' } }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      additionalProperties: false
    }
  }
}

export const logoutSchema: FastifySchema = {
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
      token: { type: 'string' },
    }
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

export const userStatusSchema: FastifySchema = {
  params: {
    userId: { type: 'string' }
  },
  body: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE'],
        description: 'status allow with [ACTIVE, INACTIVE] only'
      }
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
}

export const documentStatusSchema: FastifySchema = {
  params: {
    userId: { type: 'string' }
  },
  body: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['NO_DOCUMENT', 'WAIT_FOR_VERIFIED', 'VERIFIED', 'REJECTED'],
        description: 'status allow with [NO_DOCUMENT, WAIT_FOR_VERIFIED, VERIFIED, REJECTED] only'
      }
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
}
