#! /usr/bin/env node

require('any-promise/register/bluebird');

const path = require('path');
const program = require('commander');
const _ = require('lodash');
const updateNotifier = require('update-notifier');
const winston = require('winston');
const chalk = require('chalk');
const fs = require('fs');
const dotenv = require('dotenv');
const wordwrap = require('wordwrap');

const pkg = require('../package.json');
const output = require('../lib/output');

require('simple-errors');

// Look for a .env file two levels up and in the current directory
const dotenvPaths = [path.join(process.cwd(), '../'), process.cwd()];
dotenvPaths.forEach(dir => {
  const filePath = path.join(dir, '.env');
  if (fs.existsSync(filePath)) {
    const envConfig = dotenv.parse(fs.readFileSync(filePath));

    _.forEach(envConfig, (value, key) => {
      if (_.startsWith(key, 'YOUAPPZ_')) {
        process.env[key] = value;
      }
    });
  }
});

if (process.env.APPZ_ENV) {
  process.env.NODE_ENV = process.env.APPZ_ENV;
} else {
  process.env.NODE_ENV = 'production';
}
process.env.NODE_CONFIG_DIR = path.join(__dirname, '../config');

// If the CI environment variables is not set and there is an APPZ_API_KEY
// then assume this is a CI env.
if (!process.env.CI && process.env.APPZ_API_KEY) {
  process.env.CI = 1;
}

// If this is not a CI build then log to a file rather than stdout
if (!process.env.CI) {
  winston.remove(winston.transports.Console);
  winston.add(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'appz-debug.log')
    })
  );
}

const log = winston;

updateNotifier({
  packageName: pkg.name,
  packageVersion: pkg.version,
  updateCheckInterval: 1000 * 60 * 60 * 2 // Check for updates every 2 hours
}).notify();

program
  .version(pkg.version)
  .option('--debug', 'Emit debug messages')
  .option(
    '--customer [customerId]',
    'The id of the Youappz customer account to perform the command on behalf of.'
  )
  .option('-n, --name [name]')
  .option('-v, --value [value]')
  .option('-N, --subdomain [subdomain]')
  .option('-m, --message [message]')
  .option('-s, --stage [stage]')
  .option('-d, --directory [directory]')
  .option('-S, --source [source]')
  .option('-q, --quick-start [quickStart]')
  .option('-r, --repo [repo]')
  .option('-c, --commit-url [commitUrl]')
  .option('-R, --reset [reset]')
  .option('-f, --format [format]')
  .option('-D, --delete')
  .option('-f, --force');

// Create new website
program.command('create').action(commandAction(require('../commands/create')));

// list all websites
program.command('list').action(commandAction(require('../commands/list')));

program.command('delete').action(
  commandAction(require('../commands/delete'), {
    loadWebsite: true
  })
);

program
  .command('account')
  .action(commandAction(require('../commands/account')));

program.command('apikey').action(commandAction(require('../commands/apikey')));

program.command('info').action(
  commandAction(require('../commands/info'), {
    loadWebsite: true,
    requireAuth: true
  })
);

program.command('domain').action(
  commandAction(require('../commands/domain'), {
    loadWebsite: true
  })
);

// Deploy app version
program.command('deploy').action(
  commandAction(require('../commands/deploy'), {
    loadWebsite: true,
    loadManifest: true
  })
);

program.command('login').action(
  commandAction(require('../commands/login'), {
    requireAuth: false
  })
);

program.command('signup').action(
  commandAction(require('../commands/signup'), {
    requireAuth: false
  })
);

// program.command('validate').action(
//   commandAction(require('../commands/validate'), {
//     loadManifest: true,
//     requireAuth: false
//   })
// );

program.command('help').action(
  commandAction(require('../commands/help'), {
    requireAuth: false
  })
);


program.command('versions').action(
  commandAction(require('../commands/versions'), {
    loadWebsite: true
  })
);

program.command('download').action(
  commandAction(require('../commands/download'), {
    loadWebsite: false
  })
);

// Deploy app version
program.command('dev').action(
  commandAction(require('../commands/dev'), {   
  })
);


program.parse(process.argv);

if (!process.argv.slice(2).length) {
  require('../commands/help')(program);
}

process.on('SIGINT', () => {
  output.blankLine();
  output.yellow('Aborted');

  process.exit(1);
});

function commandAction(command, commandOptions) {
  // Extend any options from program to options.
  return () => {
    if (process.env.NODE_ENV === 'development' || program.debug) {
      winston.level = 'debug';
    }

    // Don't require config until after NODE_ENV has been set
    const config = require('config');

    log.debug('Config environment is %s', config.util.getEnv('NODE_ENV'));

    _.defaults(program, {
      cwd: process.cwd(),
      customerId: process.env.AERO_CUSTOMER,
      subCommand: (commandOptions || {}).subCommand
    });

    // Run the command
    require('../lib/cli-init')(program, commandOptions)
      .then(() => command(program))
      .catch(err => {
        console.log(err.status)
        output.blankLine();
        // console.log
        if (err.status === 401) {
          output(
            chalk.dim('Invalid authToken. Try logging in first with ') +
              chalk.green.underline('appz login')
          );
        } else if (err.formatted === true) {
          output(chalk.yellow('Error:'));
          output(wordwrap(4, 70)(err.message));
        } else if (err.doNothing !== true) {
          log.error(Error.toJson(err));
          output(chalk.dim('Unexpected error:'));
          output(wordwrap(4, 70)(chalk.red(err.message)));
          if (process.env.NODE_ENV !== 'production' || program.debug) {
            output(JSON.stringify(Error.toJson(err)));
          }
        }
        output.blankLine();

        process.exit(1);
      });
  };
}
