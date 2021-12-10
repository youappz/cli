const _ = require('lodash');
const chalk = require('chalk');
const urlJoin = require('url-join');
const output = require('../lib/output');
const api = require('../lib/api');

module.exports = program => {
   return displayAppz(program);
};



function listAppz(program) {
  const url = urlJoin(program.apiUrl, `apps`);
  return api.get({url, authToken: program.authToken});
}

function displayAppz(program) {
  output.blankLine();
  output('All websites');
  output.blankLine();

  return listAppz(program).then(appz => {
    
    if (Object.keys(appz).length === 0) {
      output('There are no websites right now.');
      output(
        'Create a new Website with the ' +
          chalk.green.underline('appz create') +
          ' command.'
      );
      return
    }

    
    appz.forEach(app => {
      process.stdout.write(_.padStart(app.id, 10, ' '));
      process.stdout.write(_.padStart(app.status, 10, ' '));
      process.stdout.write('    ');
     
      process.stdout.write(_.padStart(app.created, 10, ' '));
      
      process.stdout.write('    ');
      if (app.domain && Object.keys(app.domain).length > 0) {
        const domain = app.domain.subDomain + '.' + app.domain.name
        process.stdout.write(
          _.padEnd(chalk.yellow.underline('https://' + domain.replace('@.','')), 10,' ')
        );
      } else {
        process.stdout.write(
          _.padEnd(chalk.yellow.underline(`https://${app.id}.sitez.live`), 10,' ')
        );
      }
      process.stdout.write('\n');
    });

    output.blankLine();
  });
}
