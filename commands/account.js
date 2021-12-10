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

    })
  
};
