import { getConnection } from 'typeorm';
import { toMb } from './convert';
import pkgDir from 'pkg-dir'
import prettyMs from 'pretty-ms'
import * as AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB()
const cognito = new AWS.CognitoIdentityServiceProvider()

export const routeResponseSchemaOpts = {
  metrics: {
    type: 'object',
    properties: {
      uptime: { types: 'string' },
      start: { types: 'string' },
      env: { types: 'string' },
      name: { types: 'string' },
      version: { types: 'string' },
      node: { types: 'string' },
      dbIsConnected: {
        type: 'boolean',
      },
      memory: {
        type: 'object',
        properties: {
          rss: { type: 'string' },
          external: { type: 'string' },
          heapUsed: { type: 'string' },
          heapTotal: { type: 'string' },
          eventLoopDelay: { type: 'number' },
          eventLoopUtilized: { type: 'number' },
        }
      },
      memoryUsage: {
        type: 'object',
        properties: {

          rssBytes: { type: 'string' },
          heapUsed: { type: 'string' },

        }
      }
    },
  },
}

const dynamoTable = (params) => new Promise((resolve, reject) => {
  dynamoDb.describeTable(params, function (err, data) {
    if (err) return reject(err)
    resolve(data)
  });
})

const cognitoPool = (params) => new Promise((resolve, reject) => {
  cognito.describeUserPool(params, function (err, data) {
    if (err) return reject(err)
    resolve(data)
  });
})

const cognitoPoolClient = (params) => new Promise((resolve, reject) => {
  cognito.describeUserPoolClient(params, function (err, data) {
    if (err) return reject(err)
    resolve(data)
  });
})

export const healthCheck = async (fastifyInstance) => {
  const mem = fastifyInstance.memoryUsage()
  const rootDir = pkgDir.sync();
  const path = require('path');
  // istanbul ignore next
  const { name = '', version = '' } = require(path.join(rootDir, 'package.json'));
  // istanbul ignore next
  const env = process.env.NODE_ENV || 'unknown';
  const started = new Date().toISOString();
  const pmem = process.memoryUsage();
  let dbIsConnected = true

  if (process.env.OTP_TABLE) {
    await dynamoTable({ TableName: process.env.OTP_TABLE })
  }

  if (process.env.USER_TABLE) {
    await dynamoTable({ TableName: process.env.USER_TABLE });
  }

  if (process.env.USER_RESET_PASS_TABLE) {
    await dynamoTable({ TableName: process.env.USER_RESET_PASS_TABLE });
  }

  if (process.env.UPLOAD_LINK_DYNAMO) {
    await dynamoTable({ TableName: process.env.UPLOAD_LINK_DYNAMO });
  }

  if (!getConnection().isConnected) {
    throw new Error("Can't connect to the databases.");
  }

  if (process.env.USER_POOL_ID) {
    await cognitoPool({ UserPoolId: process.env.USER_POOL_ID })

    if (process.env.CLIENT_ID) {
      const clientData = await cognitoPoolClient({
        UserPoolId: process.env.USER_POOL_ID,
        ClientId: process.env.CLIENT_ID
      })
    }
  }



  return {
    metrics: {
      env, name, version, node: process.version, start: started,
      get uptime() {
        const ms = process.uptime() * 1000
        return prettyMs(ms)
      },
      memory: {
        rss: toMb(pmem.rss),
        external: toMb(pmem.external),
        heapUsed: toMb(pmem.heapUsed),
        heapTotal: toMb(pmem.heapTotal),
        eventLoopDelay: mem.eventLoopDelay,
        eventLoopUtilized: mem.eventLoopUtilized,
      },
      dbIsConnected
    },
  }
}
