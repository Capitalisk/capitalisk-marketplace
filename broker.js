module.exports = (agServer) => {
  const uuid = require('uuid');
  const sccBrokerClient = require('scc-broker-client');

  const SOCKETCLUSTER_WS_ENGINE = process.env.SOCKETCLUSTER_WS_ENGINE || 'ws';
  const SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT =
    Number(process.env.SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT) || 1000;

  const SCC_INSTANCE_ID = uuid.v4();
  const SCC_STATE_SERVER_HOST = process.env.SCC_STATE_SERVER_HOST || null;
  const SCC_STATE_SERVER_PORT = process.env.SCC_STATE_SERVER_PORT || null;
  const SCC_MAPPING_ENGINE = process.env.SCC_MAPPING_ENGINE || null;
  const SCC_CLIENT_POOL_SIZE = process.env.SCC_CLIENT_POOL_SIZE || null;
  const SCC_AUTH_KEY = process.env.SCC_AUTH_KEY || null;
  const SCC_INSTANCE_IP = process.env.SCC_INSTANCE_IP || null;
  const SCC_INSTANCE_IP_FAMILY = process.env.SCC_INSTANCE_IP_FAMILY || null;
  const SCC_STATE_SERVER_CONNECT_TIMEOUT =
    Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || null;
  const SCC_STATE_SERVER_ACK_TIMEOUT =
    Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || null;
  const SCC_STATE_SERVER_RECONNECT_RANDOMNESS =
    Number(process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || null;
  const SCC_PUB_SUB_BATCH_DURATION =
    Number(process.env.SCC_PUB_SUB_BATCH_DURATION) || null;
  const SCC_BROKER_RETRY_DELAY =
    Number(process.env.SCC_BROKER_RETRY_DELAY) || null;

  if (SCC_STATE_SERVER_HOST) {
    // Setup broker client to connect to SCC.
    let sccClient = sccBrokerClient.attach(agServer.brokerEngine, {
      instanceId: SCC_INSTANCE_ID,
      instancePort: SOCKETCLUSTER_PORT,
      instanceIp: SCC_INSTANCE_IP,
      instanceIpFamily: SCC_INSTANCE_IP_FAMILY,
      pubSubBatchDuration: SCC_PUB_SUB_BATCH_DURATION,
      stateServerHost: SCC_STATE_SERVER_HOST,
      stateServerPort: SCC_STATE_SERVER_PORT,
      mappingEngine: SCC_MAPPING_ENGINE,
      clientPoolSize: SCC_CLIENT_POOL_SIZE,
      authKey: SCC_AUTH_KEY,
      stateServerConnectTimeout: SCC_STATE_SERVER_CONNECT_TIMEOUT,
      stateServerAckTimeout: SCC_STATE_SERVER_ACK_TIMEOUT,
      stateServerReconnectRandomness: SCC_STATE_SERVER_RECONNECT_RANDOMNESS,
      brokerRetryDelay: SCC_BROKER_RETRY_DELAY,
    });

    if (SOCKETCLUSTER_LOG_LEVEL >= 1) {
      (async () => {
        for await (let { error } of sccClient.listener('error')) {
          error.name = 'SCCError';
          console.error(error);
        }
      })();
    }
  }
};
