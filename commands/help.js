const chalk = require('chalk');
const _ = require('lodash');
const yaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');
const wordwrap = require('wordwrap');

const output = require('../lib/output');

module.exports = program => {
  output.intro();

  // Check if the help command was called with a topic, i.e. appz help create.
  var commandTopic;
  const helpIndex = program.rawArgs.indexOf('help');
  if (helpIndex !== -1 && helpIndex < program.rawArgs.length - 1) {
    commandTopic = program.rawArgs[helpIndex + 1];
  }

  return fs.readFile(path.join(__dirname, './index.yml')).then(contents => {
    const commandMetadata = yaml.safeLoad(contents.toString());

    if (commandTopic) {
      if (!commandMetadata[commandTopic]) {
        output('    There is no command named ' + commandTopic);
        output.blankLine();
        return null;
      }

      displayCommandHelp(commandTopic, commandMetadata[commandTopic]);
    } else {
      displayTopLevelHelp(commandMetadata);
    }
    output.blankLine();
    return null;
  });
};

// Display the top level help
function displayTopLevelHelp(metadata) {
  output(chalk.dim('Usage:'));
  output('    $ appz [command] [options]');
  output.blankLine();

  output(chalk.dim('Commands:'));
  const commandNames = Object.keys(metadata).sort();

  commandNames.forEach(command => {
    output('    ' + _.padEnd(command, 15, ' ') + metadata[command].summary);
  });

  output.blankLine();
  output(
    '    Type ' +
      chalk.green.underline('appz help COMMAND') +
      ' for more details'
  );
}

// Display help specific to a command
function displayCommandHelp(command, metadata) {
  output(chalk.dim('Usage:'));

  var usage = 'appz ' + command;
  if (metadata.options) usage += ' [options]';
  output('    $ ' + usage);
  output.blankLine();

  output(chalk.dim('Summary:'));
  output('    ' + metadata.summary);

  if (metadata.options) {
    output.blankLine();
    output(chalk.dim('Options:'));

    metadata.options.forEach(option => {
      output(
        '    -' +
          option.short +
          ', --' +
          _.padEnd(option.name, 12, ' ') +
          option.summary
      );
    });
  }

  if (metadata.details) {
    output.blankLine();
    output(chalk.dim('Details:'));
    output(_.trimEnd(wordwrap(4, 70)(metadata.details)));
  }

  if (metadata.examples) {
    output.blankLine();
    output(chalk.dim('Examples:'));
    metadata.examples.forEach(example => {
      if (_.startsWith(example, '#')) {
        output('    ' + chalk.dim(example));
      } else {
        output('    $ ' + example);
      }
    });
  }
}
