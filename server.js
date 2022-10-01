const http = require('http');
const eetase = require('eetase');
const socketClusterServer = require('socketcluster-server');
const express = require('express');
const serveStatic = require('serve-static');
const path = require('path');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const broker = require('./broker');

const ENVIRONMENT = process.env.ENV || 'dev';
const SOCKETCLUSTER_PORT = process.env.SOCKETCLUSTER_PORT || 8000;
const SOCKETCLUSTER_LOG_LEVEL = process.env.SOCKETCLUSTER_LOG_LEVEL || 2;

let agOptions = {};

if (process.env.SOCKETCLUSTER_OPTIONS) {
  let envOptions = JSON.parse(process.env.SOCKETCLUSTER_OPTIONS);
  Object.assign(agOptions, envOptions);
}

let httpServer = eetase(http.createServer());
let agServer = socketClusterServer.attach(httpServer, agOptions);

let expressApp = express();
if (ENVIRONMENT === 'dev') {
  // Log every HTTP request. See https://github.com/expressjs/morgan for other
  // available formats.
  expressApp.use(morgan('dev'));
}
expressApp.use(serveStatic(path.resolve(__dirname, 'public')));

// Add GET /health-check express route
expressApp.get('/health-check', (req, res) => {
  res.status(200).send('OK');
});

// HTTP request handling loop.
(async () => {
  for await (let requestData of httpServer.listener('request')) {
    expressApp.apply(null, requestData);
  }
})();

// SocketCluster/WebSocket connection handling loop.
(async () => {
  for await (let { socket } of agServer.listener('connection')) {
    (async () => {
      for await (const request of socket.procedure('signup')) {
        console.log(request.data);
        try {
          await prisma.user.create({
            data: {
              ...request.data,
              password: await bcrypt.hash(request.data.password, 10),
            },
          });
          request.end();
        } catch (e) {
          console.error(e);
          request.error(e);
        }
      }
    })();

    (async () => {
      for await (const request of socket.procedure('login')) {
        console.log(request.data);
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: request.data.email,
            },
          });

          if (await bcrypt.compare(request.data.password, user.password)) {
            delete user.password;
            socket.setAuthToken(user);
            request.end();
          } else {
            throw new Error('No user found');
          }
        } catch (e) {
          console.error(e);
          request.error(e);
        }
      }
    })();

    (async () => {
      for await (const request of socket.procedure('logout')) {
        socket.deauthenticate();
      }
    })();

    (async () => {
      for await (const request of socket.procedure('create/blockchain')) {
        try {
          await prisma.p;
          request.end();
        } catch (e) {
          console.error(e);
          request.error(e);
        }
      }
    })();
  }
})();

httpServer.listen(SOCKETCLUSTER_PORT);

if (SOCKETCLUSTER_LOG_LEVEL >= 1) {
  (async () => {
    for await (let { error } of agServer.listener('error')) {
      console.error(error);
    }
  })();
}

if (SOCKETCLUSTER_LOG_LEVEL >= 2) {
  console.log(
    `   [Active] SocketCluster worker with PID ${process.pid} is listening on port ${SOCKETCLUSTER_PORT}`,
  );

  (async () => {
    for await (let { warning } of agServer.listener('warning')) {
      console.warn(warning);
    }
  })();
}

broker(agServer);
