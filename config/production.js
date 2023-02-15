module.exports = {
  NODE_ENV: 'production',
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  JWT_EXPIRY_KEY: process.env.JWT_EXPIRY_KEY,
  API_VERSION: process.env.API_VERSION,
  server: {
    port: process.env.PORT || 8030,
  },
  src: {
    root: 'dist',
    fileExtension: 'js',
  },
  nvm: require('./nevermined').config,
  security: {
    enableHttpsRedirect: process.env.ENABLE_HTTPS_REDIRECT,
  },
  ...require('./from-env').config,
}
