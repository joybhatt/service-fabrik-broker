'use strict';

const Promise = require('bluebird');
const TokenInfo = require('./TokenInfo');
const config = require('../config');
const errors = require('../errors');
const logger = require('../logger');
const Unauthorized = errors.Unauthorized;

class TokenIssuer {
  constructor(uaa) {
    this.uaa = uaa;
    this.tokenInfo = new TokenInfo();
  }

  clearTimeoutObject() {
    if (this.timeoutObject) {
      clearTimeout(this.timeoutObject);
      this.timeoutObject = undefined;
    }
  }

  logout() {
    this.clearTimeoutObject();
    this.tokenInfo = new TokenInfo();
    return this;
  }

  login() {
    return this.uaa.accessWithPassword(config.cf.username, config.cf.password);
  }

  refreshToken() {
    logger.silly(`Starting to refresh the accessToken which will expire in ${this.tokenInfo.accessTokenExpiresIn} seconds.`);
    return this.uaa.accessWithRefreshToken(this.tokenInfo.refreshToken);
  }

  updateTokenInfo(tokenInfo) {
    this.tokenInfo.update(tokenInfo);
    const delay = this.tokenInfo.accessTokenExpiresIn - 15;
    if (delay > 0 && delay < 2147483647) {
      this.clearTimeoutObject();
      this.timeoutObject = setTimeout(() => {
        return this.refreshToken()
          .then(result => this.updateTokenInfo(result))
          .catch(err => logger.error(err.message));
      }, delay * 1000);
    }
    return this.tokenInfo;
  }

  getAccessToken() {
    if (!this.tokenInfo.accessTokenExpiresSoon) {
      return Promise.resolve(this.tokenInfo.accessToken);
    }
    return Promise
      .try(() => {
        if (!this.tokenInfo.refreshTokenExpiresSoon) {
          return this.refreshToken();
        }
        throw new Unauthorized('Login required');
      })
      .catch(() => this.login())
      .then(result => this.updateTokenInfo(result).accessToken);
  }
}

module.exports = TokenIssuer;