const chalk = require('chalk');
const path = require('path');
const _ = require('lodash');
const urlJoin = require('url-join');
const output = require('../lib/output');
const api = require('../lib/api');
const download = require('../lib/download');
const manifest = require('../lib/manifest');
const ora = require('ora');

// Command to download a website source files
module.exports = program => {
  // output.blankLine();
  // output(
  //   'Downloading YouAppz website' +
  //     (program.source ? '' : ' in this directory')
  // );
  output.blankLine();

  return (
    Promise.resolve()
      .then(() => {
        if (_.isEmpty(program.name)) {
          return Promise.reject(
            Error.create('Missing --name argument.', {formatted: true})
          );
        }
        return null;
      })
      // fetch signed url to download source tar.gz file
      .then(() => {
        return api
          .post({
            url: urlJoin(
              program.apiUrl,
              `/apps/${program.name}/signed-url`
            ),
            body: { key: program.name + '/latest.tar.gz'},
            authToken: program.authToken
          })
          .catch(err => {
            throw Error.create(
              'Error getting presigned url: ' + err.message,
              {},
              err
            );
          });
      })
      // download and gunzip the source tar.gz file
      .then((result) => {
        program.sourceUrl = result.signedUrl
        // If a repo argument was provided then create a new folder to extract
        // the repo contents to.
        if (program.name ) {
          return createSourceDirectory(program);
        }
        return null;
      })
      .then(() => manifest.loadSafe(program, false))
      .then(appManifest => {
        appManifest.id = program.name;
        return manifest.save(program, appManifest).then(() => {
          output.blankLine();
          output(
            '    Website ' +
              chalk.underline(program.name) +
              ' downloaded.'
          );
          output.blankLine();

          var nextCommand;
          if (program.name) {
            nextCommand = 'cd ' + program.name + ' && appz deploy';
          } else {
            nextCommand = 'appz deploy';
          }

          output('    To deploy your website, run the following:');
          output.blankLine();
          output('    ' + chalk.bold('$') + ' ' + nextCommand);
          output.blankLine();
        });
      })
      
  );
};


function createSourceDirectory(program) {
  return Promise.resolve()
    .then(() => {
      program.cwd = path.join(program.cwd, program.name);      
      const sourceUrl = program.sourceUrl; 
      // const spinner = startSpinner(program, 'Downloading archive from YouAppz');

      return Promise.resolve()
      .then(() => {
        return download(sourceUrl, program.cwd)
      }).then((result) => {
        // spinner.succeed();
        return result
      })
      
    });
}


function startSpinner(program, message) {
  // Assume if there is an YOUAPPZ_API_KEY this is running in a CI build.
  // Don't show spinners, it just messes up the CI log output.
  if (program.unitTest || process.env.CI) {
    log.info(message);
    return {isSpinning: false, succeed: () => {}, fail: () => {}};
  }

  return ora({text: message, color: 'white'}).start();
}