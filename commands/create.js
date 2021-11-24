const log = require('winston');
const chalk = require('chalk');
const path = require('path');
const _ = require('lodash');
const inquirer = require('inquirer');
const urlJoin = require('url-join');
const output = require('../lib/output');
const api = require('../lib/api');
const userConfig = require('../lib/user-config');
const download = require('../lib/download');
const manifest = require('../lib/manifest');

const INVALID_NAME_ERROR =
  'Website name is invalid. Must be url-friendly string ' +
  'consisting only of numbers, lowercase letters, and dashes.';

// Command to create a new website
module.exports = program => {
  output.blankLine();
  output(
    'Creating new YouAppz website' +
      (program.source ? '' : ' in this directory')
  );
  output.blankLine();

  return (
    Promise.resolve()
      .then(() => {
        // if (_.isString(program.name) && program.name.length > 0) {
        //   return checkNameAvailability(program);
        // }
        return null;
      })
      // // Refresh the auth token so that if the current user has been
      // // invited to a team account since they last logged in it will
      // // be returned in the subsequent API call to /customers.
      // .then(() => refreshAuthToken(program))
      .then(() => {
        // If the user is associated with multiple accounts, prompt them to choose
        // which one to associate the site with.
        return api.get({
          url: urlJoin(program.apiUrl, '/customers'),
          authToken: program.authToken
        });
      })
      .then(customers => {
        if (customers.length < 2) return null;

        return promptForCustomer(program, customers).then(customerId => {
          program.customerId = customerId;
          output.blankLine();
        });
      })
      .then(() => {
        // If a repo argument was provided then create a new folder to extract
        // the repo contents to.
        if (program.source || program.quickStart) {
          return createSourceDirectory(program);
        }
        return null;
      })
      .then(() => manifest.loadSafe(program, false))
      .then(appManifest => {
        return createWebsite(program).then(website => ({website, appManifest}));
      })
      .then(params => {
        params.appManifest.id = params.website.appId;

        return manifest.save(program, params.appManifest).then(() => {
          output(
            '    Website ' +
              chalk.underline(params.website.url) +
              ' created. The trial period will end in 30 days.'
          );
          output.blankLine();
          output(chalk.bold('    --NOTHING HAS BEEN DEPLOYED YET--'));
          output.blankLine();

          var nextCommand;
          if (program.source || program.quickStart) {
            nextCommand = 'cd ' + program.name + ' && appz deploy';
          } else {
            nextCommand = 'appz deploy';
          }

          output('    To deploy your first version, run the following:');
          output.blankLine();
          output('    ' + chalk.bold('$') + ' ' + nextCommand);
          output.blankLine();
        });
      })
  );
};

function checkNameAvailability(program) {
  return api
    .post({
      url: urlJoin(program.apiUrl, '/apps/available'),
      body: {name: program.name},
      authToken: program.authToken
    })
    .then(resp => {
      if (resp.available !== true) {
        return throwNameTakenError(program.name);
      }
      return null;
    })
    .catch(err => {
      if (err.code === 'invalidAppName') {
        throw Error.create(INVALID_NAME_ERROR, {formatted: true});
      }
      throw err;
    });
}

function throwNameTakenError(name) {
  throw Error.create(
    'The website name ' +
      name +
      ' is already taken. Please try a different name.',
    {formatted: true}
  );
}

function refreshAuthToken(program) {
  return api
    .get({
      url: urlJoin(program.apiUrl, '/auth/refresh'),
      authToken: program.authToken
    })
    .then(result => {
      return userConfig.set({
        authToken: result.sessionToken,
        customerRoles: result.customerRoles
      });
    })
    .then(config => {
      Object.assign(program, config);
      return null;
    });
}

function promptForCustomer(program, customers) {
  return inquirer
    .prompt([
      {
        name: 'customerId',
        type: 'list',
        message: 'Select which account this website belongs to:',
        choices: customers.map(customer => {
          return {
            name: customer.name,
            value: customer.customerId
          };
        }),
        default: program.customerId
      }
    ])
    .then(answers => answers.customerId);
}

// Invoke the API to create the website
function createWebsite(program) {
  const appData = {
    name: _.isString(program.name) ? program.name : null
  };
  if (!_.isEmpty(program.quickStart)) {
    appData.theme = program.quickStart;
  }

  return api
    .post({
      url: urlJoin(program.apiUrl, `/customers/${program.customerId}/apps`),
      authToken: program.authToken,
      body: appData
    })
    .catch(error => {
      switch (error.code) {
        case 'invalidAppName':
          throw Error.create(INVALID_NAME_ERROR, {formatted: true});
        case 'appNameUnavailable':
          throwNameTakenError(program.name);
          break;
        default:
          throw error;
      }
    });
}

function createSourceDirectory(program) {
  return Promise.resolve()
    .then(() => {
      // if (!_.isString(program.name) || _.isEmpty(program.name)) {
      //   return getRandomSiteName(program).then(siteName => {
      //     log.debug('Generated random site name %s', siteName);
      //     program.name = siteName;
      //   });
      // }
    })
    .then(() => {
      program.cwd = path.join(program.cwd, program.name);
      var sourceUrl;
      if (program.quickStart) {
        sourceUrl = urlJoin(
          program.quickStartBaseUrl,
          program.quickStart + '.tar.gz'
        );
        output(
          '    ' + chalk.dim('Downloading quick start ' + program.quickStart)
        );
      } else {
        sourceUrl = program.source;
        output('    ' + chalk.dim('Downloading source archive ' + sourceUrl));
      }

      return download(sourceUrl, program.cwd);
    });
}

function getRandomSiteName(program) {
  const opts = {
    url: urlJoin(program.apiUrl, '/apps/random-name'),
    authToken: program.authToken
  };
  return api.get(opts).then(result => result.name);
}
