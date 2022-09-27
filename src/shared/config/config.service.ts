/* eslint @typescript-eslint/no-var-requires: 0 */
/* eslint @typescript-eslint/no-unsafe-assignment: 0 */
/* eslint @typescript-eslint/no-unsafe-argument: 0 */
import { Config } from '@nevermined-io/nevermined-sdk-js';
import * as Joi from 'joi';
import { get as loGet } from 'lodash';
import { Logger } from '../logger/logger.service';

export interface EnvConfig {
  [key: string]: string;
  nvm: any
}

export interface CryptoConfig {
  
}

const configProfile = require('../../../config');

const DOTENV_SCHEMA = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test', 'staging').default('development'),
  JWT_SECRET_KEY: Joi.string().required().error(new Error('JWT_SECRET_KEY is required!')),
  JWT_EXPIRY_KEY: Joi.string().default('60m'),
  server: Joi.object({
    port: Joi.number().default(3000),
  }),
  security: Joi.object({
    enableHttpsRedirect: Joi.bool().default(false),
  }).default({
    enableHttpsRedirect: false,
  }),
  nvm: Joi.any(),
  PROVIDER_KEYFILE: Joi.string().required().error(new Error('PROVIDER_KEYFILE is required!')),
  RSA_PRIVKEY_FILE: Joi.string().required().error(new Error('RSA_PRIVKEY_FILE is required!')),
  RSA_PUBKEY_FILE: Joi.string().required().error(new Error('RSA_PUBKEY_FILE is required!')),
  PROVIDER_BABYJUB_SECRET: Joi.string(),
  PROVIDER_BABYJUB_PUBLIC1: Joi.string(),
  PROVIDER_BABYJUB_PUBLIC2: Joi.string(),
  PROVIDER_PASSWORD: Joi.string(),
  ESTUARY_TOKEN: Joi.string(),
  ESTUARY_ENDPOINT: Joi.string(),
  FILECOIN_GATEWAY: Joi.string(),
  AWS_S3_ACCESS_KEY_ID: Joi.string(),
  AWS_S3_SECRET_ACCESS_KEY: Joi.string(),
  AWS_S3_ENDPOINT: Joi.string(),
  AWS_S3_BUCKET_NAME: Joi.string(),
});

type DotenvSchemaKeys =
  | 'NODE_ENV'
  | 'server.port'
  | 'database.url'
  | 'JWT_SECRET_KEY'
  | 'JWT_EXPIRY_KEY'
  | 'security.enableHttpsRedirect'
  | 'PROVIDER_KEYFILE'
  | 'RSA_PRIVKEY_FILE'
  | 'RSA_PUBKEY_FILE'
  | 'PROVIDER_BABYJUB_SECRET'
  | 'PROVIDER_BABYJUB_PUBLIC1'
  | 'PROVIDER_BABYJUB_PUBLIC2'
  | 'PROVIDER_PASSWORD'
  | 'ESTUARY_TOKEN'
  | 'ESTUARY_ENDPOINT'
  | 'FILECOIN_GATEWAY'
  | 'AWS_S3_ACCESS_KEY_ID'
  | 'AWS_S3_SECRET_ACCESS_KEY'
  | 'AWS_S3_ENDPOINT'
  | 'AWS_S3_BUCKET_NAME'

export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor() {
    this.envConfig = this.validateInput(configProfile);
  }

  get<T>(path: DotenvSchemaKeys): T | undefined {
    return loGet(this.envConfig, path) as unknown as T | undefined;
  }

  nvm(): Config {
    return this.envConfig.nvm
  }

  getProviderBabyjub() {
    return {
      x: this.envConfig.PROVIDER_BABYJUB_PUBLIC1 || '',
      y: this.envConfig.PROVIDER_BABYJUB_PUBLIC2 || '',
      secret: this.envConfig.PROVIDER_BABYJUB_SECRET || '',
    };
  }

  private validateInput(envConfig: EnvConfig): EnvConfig {
    const { error, value: validatedEnvConfig } = DOTENV_SCHEMA.validate(envConfig, {
      allowUnknown: true,
      stripUnknown: true,
    });
    if (error) {
      Logger.error('Missing configuration please provide followed variable!\n\n', 'ConfigService');
      Logger.error(error.message, 'ConfigService');
      process.exit(2);
    }
    return validatedEnvConfig as EnvConfig;
  }
}
