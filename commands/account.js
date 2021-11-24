const log = require('winston');
const _ = require('lodash');
const urlJoin = require('url-join');
const chalk = require('chalk');

const api = require('../lib/api');
const output = require('../lib/output');

// Command to create a new website
module.exports = program => {
  log.debug('List websites for customer %s', program.customerId);
  return api
    .get({
      url: urlJoin(program.apiUrl, `/customers/${program.customerId}`),
      authToken: program.authToken
    })
    .then(customer => {
      output.blankLine();
      output(chalk.dim('Account name:'));
      output('    ' + customer.name);

      output.blankLine();
      output(chalk.dim('Account ID:'));
      output('    ' + customer.customerId);
      output.blankLine();

      output(chalk.dim('Account type:'));
      output('    ' + customer.customerType);
      output.blankLine();

      return api.get({
        url: urlJoin(program.apiUrl, `/customers/${program.customerId}/apps`),
        authToken: program.authToken
      });
    })
    .then(apps => {
      output(chalk.dim('Websites:'));

      if (apps.length === 0) {
        output("    You don't have any websites yet.");
        output(
          '    Run ' +
            chalk.green.underline('appz create') +
            ' in the root of your project directory.'
        );
      } else {
        apps.forEach(app => {
          process.stdout.write('    ' + _.padEnd(app.name, 25, ' '));
          process.stdout.write(_.padEnd(app.url, 50, ' '));
          process.stdout.write(_.padEnd(app.subscriptionPlan ? 'PRO' : 'FREE'));
          process.stdout.write('\n');
        });
      }

      output.blankLine();
    });
};
