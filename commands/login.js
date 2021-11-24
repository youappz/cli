const inquirer = require('inquirer');
const urlJoin = require('url-join');
const chalk = require('chalk');
const userConfig = require('../lib/user-config');
const api = require('../lib/api');
const output = require('../lib/output');

module.exports = program => {
  output.intro();

  if (!program.email) {
    output(
      "If you don't already have an account, you can run " +
        chalk.green.underline('appz register') +
        '.'
    );
  }

  // Prompt for login
  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'email',
        default: program.email,
        message: 'Email:'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:'
      }
    ])
    .then(answers => {
      return api
        .post({
          url: urlJoin(program.apiUrl, '/user/login'),
          body: {email: answers.email, password: answers.password},
          requireAuth: false
        })
        .catch(err => {          
          switch (err.result) {
            case 'User does not exist.':
              throw Error.create(
                'Invalid email or password. If you ' +
                  "haven't registered yet, you can run " +
                  chalk.green.underline('appz register') +
                  '.',
                {formatted: true}
              );
            case 'emailNotVerified':
              throw Error.create(
                'The email ' +
                  chalk.underline(answers.email) +
                  ' has not been verified yet.\nPlease click on the link in the ' +
                  'verification email that was sent.',
                {formatted: true}
              );
            default:
              throw err;
          }
        })
        .then(result => {
          return userConfig.set({
            authToken: result.authToken,
            email: answers.email,
            customerRoles: result.customerRoles,
            customerId: Object.keys(result.customerRoles)[0]
          });
        });
    })
    .then(config => {
      Object.assign(program, config);

      output.blankLine();
      output(chalk.dim('Logged in as ' + config.email));
      output.blankLine();
      return null;
    });
};
