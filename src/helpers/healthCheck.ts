import { getConnection } from 'typeorm';
import { toMb } from './convert';
import pkgDir from 'pkg-dir'
import prettyMs from 'pretty-ms'

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

export const healthCheck = (fastifyInstance) => {
  const mem = fastifyInstance.memoryUsage()
  const rootDir = pkgDir.sync();
  const path = require('path');
  // istanbul ignore next
  const { name = '', version = '' } = require(path.join(rootDir, 'package.json'));
  // istanbul ignore next
  const env = process.env.NODE_ENV || 'unknown';
  const started = new Date().toISOString();
  const pmem = process.memoryUsage();
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
      dbIsConnected: getConnection().isConnected
    },
  }
}
