const _ = require('lodash');
const urlJoin = require('url-join');
const config = require('config');
const chalk = require('chalk');
const log = require('winston');

const api = require('./api');
const userConfig = require('./user-config');
const manifest = require('./manifest');
const output = require('./output');

require('simple-errors');

// Initialization routine that runs before any CLI command
module.exports = (program, options) => {
  log.debug('initiliazing CLI');

  _.defaults(program, {
    cwd: process.cwd(),
    customerId: process.env.AERO_CUSTOMER,
    subCommand: (options || {}).subCommand
  });

  // Map all the settings in config to the program object
  _.assign(program, config);

  options = _.defaults(options || {}, {
    requireAuth: true,
    loadManifest: false,
    loadWebsite: false
  });

  // The appManifest has to be loaded in order to load the application
  // since that's where the appId is gotten from.
  if (options.loadWebsite) {
    options.loadManifest = true;
    options.requireAuth = true;
  }

  var initPromise;

  // If there is an YOUAPPZ_API_KEY environment variable, then
  // we assume this is a non-interactive process and there is no end user.
  if (process.env.YOUAPPZ_API_KEY) {
    output(
      'Using YOUAPPZ_API_KEY starting with ' +
        process.env.YOUAPPZ_API_KEY.substr(0, 10)
    );
    program.authToken = process.env.YOUAPPZ_API_KEY;
    initPromise = Promise.resolve();
  } else {
    initPromise = userConfig.read().then(conf => {
      log.debug('Assign userConfig to program object');
      _.assign(program, conf);
      // program.userConfig = conf;
    });

    if (options.requireAuth) {
      initPromise = initPromise.then(() => validateAuthContext(program));
    }
  }

  if (options.loadManifest === true) {
    log.debug('Load website manifest from current directory');
    initPromise = initPromise.then(() => {
      return manifest.load(program).then(appManifest => {
        program.appManifest = appManifest;
      });
    });
  }

  if (options.loadWebsite === true) {
    initPromise = initPromise.then(() => {
      const requestOptions = {
        url: urlJoin(program.apiUrl, `/apps/${program.appManifest.id}`),
        authToken: program.authToken
      };

      log.debug('Invoke API to fetch website %s', program.appManifest.id);
      return api.get(requestOptions).then(website => {
        program.website = website;
        if (!website) {
          throw Error.create('Invalid website id ' + program.appManifest.id, {
            formatted: true
          });
        }

        program.customerId = website.customerId;
      });
    });
  }

  log.debug(
    'Run cli initialization promises, options=%s',
    JSON.stringify(options)
  );
  return initPromise;
};

function validateAuthContext(program) {
  log.debug('Ensure auth token in userConfig');
  if (_.isEmpty(program.authToken) && _.isEmpty(program.authKey)) {
    throw Error.create(
      'This command requires authentication.\n' +
        'Either set a ' +
        chalk.yellow('YOUAPPZ_API_KEY') +
        'environment variable \n' +
        'or run ' +
        chalk.underline.green('appz login') +
        '.',
      {formatted: true}
    );
  }

  if (!program.customerId) {
    // If no explicit customerId is specified, use the first customerId
    // in the customerRoles object.
    const customerIds = Object.keys(program.customerRoles || {});
    if (customerIds.length === 0) {
      throw Error.create(
        'You are not associated with any customer accounts. \n' +
          'Run ' +
          chalk.underline.green('account --name account-name') +
          ' to create one.',
        {formatted: true}
      );
    }
  }
  return null;
}
