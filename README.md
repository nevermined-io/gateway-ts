[![banner](https://raw.githubusercontent.com/nevermined-io/assets/main/images/logo/banner_logo.png)](https://nevermined.io)

# Nevermined Node

> Nevermined node that helps to provide services around digital assets

[![Tests](https://github.com/nevermined-io/node/actions/workflows/test.yml/badge.svg)](https://github.com/nevermined-io/node/actions/workflows/test.yml)
[![Docker Build Status](https://img.shields.io/docker/cloud/build/neverminedio/node.svg)](https://hub.docker.com/repository/docker/neverminedio/node)
[![GitHub contributors](https://img.shields.io/github/contributors/nevermined-io/node.svg)](https://github.com/nevermined-io/node/graphs/contributors)

## First-time setup

### Pre-requisites

- Make sure you've installed [docker](https://www.docker.com/products/docker-desktop)
- Make sure you've installed NodeJS version. You can see the version in the `nvmrc` file
- You can also install [nvm](https://github.com/nvm-sh/nvm) in order to switch between different node versions
- Set yarn to install internal packages

### Install dependencies

Install all necessary dependencies via:

```bash
yarn
```

### Build and lint

You can build the project running

```bash
yarn build
```

And check the linter

```bash
yarn lint
```

### Copy profile configuration

Copy the local profile configuration via:

```bash
yarn setup:dev
```

This will leave you with a `local.js` file within the `config` folder that will be used as the profile configuration.

### Environment variables

The Nevermined Node reads the following environment variables allowing the configuration of the deployment without modifying any config file:

| Variable Name                        | Description                                                                                                                                                      | Example                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **WEB3_PROVIDER_URL**                | HTTP url of the web3 provider. The most popular providers are Infura & Alchemy, but anyone else can be used. The url depends on the network you want to connect. | http://mumbai.alchemy.io/v2/xxxxx                                         |
| **MARKETPLACE_URI**                  | HTTP url to the Marketplace API                                                                                                                                  | https://marketplace-api.mumbai.public.nevermined.rocks                    |
| **NODE_URI**                         | Public HTTP url where this node is exposed                                                                                                                       | https://node.mumbai.public.nevermined.rocks                               |
| **PORT**                             | Local Port the server will be listen to                                                                                                                          | `8030`                                                                    |
| **NODE_ADDRESS**                     | Public address of the Node used to send transactions to the blockchain                                                                                           | `0x068ed00cf0441e4829d9784fcbe7b9e26d4bd8d0`                              |
| **PROVIDER_KEYFILE**                 | Path to the file where is store the private key of the Node credentials                                                                                          | `/mnt/credentials/keyfile.json`                                           |
| **PROVIDER_PASSWORD**                | Password of the `PROVIDER_KEYFILE`                                                                                                                               | `passwd`                                                                  |
| **PROVIDER_BABYJUB_SECRET**          | Secret of the babyjub algorithm used for DTP                                                                                                                     | `abc`                                                                     |
| **PROVIDER_BABYJUB_PUBLIC1**         | Babyjub public key #1                                                                                                                                            | `0x2e3133fbdaeb5486b665ba78c0e7e749700a5c32b1998ae14f7d1532972602bb`      |
| **PROVIDER_BABYJUB_PUBLIC2**         | Babyjub public key #2                                                                                                                                            | `0x0b932f02e59f90cdd761d9d5e7c15c8e620efce4ce018bf54015d68d9cb35561`      |
| **RSA_PUBKEY_FILE**                  | File having the RSA public key. The Node RSA credentials can be used for encrypting/decrypting files                                                             | `/accounts/rsa_pub_key.pem`                                               |
| **RSA_PRIVKEY_FILE**                 | File having the RSA private keys                                                                                                                                 | `/accounts/rsa_priv_key.pem`                                              |
| **GRAPH_HTTP_URI**                   | Public URL of the Nevermined subgraphs. If not set if will try to fetch events through the web3provider JSON-RPC api.                                            | https://api.thegraph.com/subgraphs/name/nevermined-io/public              |
| **IPFS_GATEWAY**                     | Public IPFS gateway that can be used to fetch or upload content.                                                                                                 | https://ipfs.infura.io:5001                                               |
| **IPFS_PROJECT_ID**                  | Ipfs Project Id                                                                                                                                                  | `2DSADASD4234234234`                                                      |
| **IPFS_PROJECT_SECRET**              | Ipfs Project Secret                                                                                                                                              | `ccdafda55666dada`                                                        |
| **FILECOIN_GATEWAY**                 | Public Filecoin gateway that can be used to fetch content. The `:cid` part of the url will be replace by the file `cid`                                          | https://dweb.link/ipfs/:cid                                               |
| **ESTUARY_TOKEN**                    | Estuary is a service that facilitates the interaction with Filecoin. This variable must include the token to use their API. See more here: https://estuary.tech/ | `EST651aa3a7-4756-4bd9-a563-1cdd565894645`                                |
| **AWS_S3_ACCESS_KEY_ID**             | Amazon S3 Access Key Id                                                                                                                                          | `4535hnj43`                                                               |
| **AWS_S3_SECRET_ACCESS_KEY**         | Amazon S3 Secret Access Key                                                                                                                                      | `4535hnj43`                                                               |
| **AWS_S3_ENDPOINT**                  | Amazon S3 Endpoint url                                                                                                                                           | `https://s3.eu-west-1.amazonaws.com`                                      |
| **AWS_S3_BUCKET_NAME**               | Name of the S3 Bucket                                                                                                                                            | `metadata`                                                                |
| **ENABLE_PROVENANCE**                | If `true` it will enable the integration with the provenance registry                                                                                            | `true` or `false`                                                         |
| **ARTIFACTS_FOLDER**                 | Path where the Node will look for the Smart Contracts ABIs                                                                                                       | A file system path. If not given it will look in the `./artifacts` folder |
| **CIRCUITS_FOLDER**                  | Path where the Node will look for the Circuits.                                                                                                                  | A file system path. If not given it will look in the `./circuits` folder  |
| **ENABLE_COMPUTE**                   | Enables the Nevermined's compute endpoints                                                                                                                       | `false`                                                                   |
| **ARGO_HOST**                        | HTTP url of the Argo Workflows instance we want to use for computing capabilities. Requires ENABLE_COMPUTE = true                                                | `https://argo-workflows.instance`                                         |
| **ARGO_NAMESPACE**                   | Name of the Argo Workflows namespace where we will deploy the Nevermined's Compute Workflows. Requires ENABLE_COMPUTE = true                                     | `argo`                                                                    |
| **ARGO_AUTH_TOKEN**                  | Authorization Token for Argo Workflows. Requires ENABLE_COMPUTE = true                                                                                           | 'Bearer sdfsdfsdfvxcvVVSDFSDFSDFsdf...'                                   |
| **JWT_SUBSCRIPTION_SECRET_KEY**      | Secret key used to sign the subscription jwt tokens. It must be a 32 character string. REQUIRED                                                                  | `12345678901234567890123456789012`                                        |
| **NEVERMINED_PROXY_URI**             | The proxy address where the subscription tokens can be used.                                                                                                     | `https://proxy.nevermined.network`                                        |
| **SUBSCRIPTION_DEFAULT_EXPIRY_TIME** | The default subscription token expiry time in seconds to be used for unlimited subscriptions. Defaults to 2 years (63072000 seconds)                             | `63072000`                                                                |
| **NETWORK_AVERAGE_BLOCK_TIME**       | The average block time in milliseconds for the connected network. Used to calculate the expiry time of the subscriptions token. Defaults 2100 milliseconds       | `2100`                                                                    |
| **NEVERMINED_SDK_LOG_LEVEL**         | The log level of the nevermined sdk (0: Error, 1: Warn, 2: Log, 3: Verbose). Defaults to `0`                                                                     | `0`                                                                       |

## Install and run:

```javascript
yarn dev
```

### Build production environment

```bash
yarn build
```

## License

```
Copyright 2022 Nevermined AG

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
