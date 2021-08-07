import fastify from 'fastify'
import fastifyBlipp from "fastify-blipp";
import { bootstrap } from 'fastify-decorators';

import { resolve } from 'path';

import configApp from './config/app'
import configSwagger from './config/swagger'
import connectionDb from './plugins'

import { routeResponseSchemaOpts, healthCheck } from './helpers/healthCheck';

function build(opts: object = configApp) {
  const app = fastify(opts)
  app.register(fastifyBlipp)
  app.register(require('fastify-swagger'), configSwagger)

  app.register(require('fastify-cors'), {
    origin: (origin, cb) => {
      // if(/localhost/.test(origin)){
      //   //  Request from localhost will pass
      //   cb(null, true)
      //   return
      // }
      // Generate an error on other origins, disabling access
      // cb(new Error("Not allowed"))
      cb(null, true)
      return
    }
  })

  app.register(connectionDb)

  app.register(bootstrap, {
    directory: resolve(__dirname, `controllers`),
    mask: /\.controller\./,
  });

  app.register(require('under-pressure'), {
    maxEventLoopDelay: 1000,
    exposeStatusRoute: {
      routeResponseSchemaOpts: routeResponseSchemaOpts,
      url: '/api/v1/users/__alive__'
    },
    healthCheck: healthCheck,
    healthCheckInterval: 720e3,
  })

  return app
}

export default build
