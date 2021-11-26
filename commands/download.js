const chalk = require('chalk');
const path = require('path');
const _ = require('lodash');
const urlJoin = require('url-join');
const output = require('../lib/output');
const api = require('../lib/api');
const download = require('../lib/download');
const manifest = require('../lib/manifest');

// Command to download a website source files
module.exports = program => {
  output.blankLine();
  output(
    'Downloading YouAppz website' +
      (program.source ? '' : ' in this directory')
  );
  output.blankLine();

  return (
    Promise.resolve()
      .then(() => {
        console.log(program.name)
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
          output(
            '    Website ' +
              chalk.underline(program.name) +
              ' downloaded.'
          );
         

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
      output('    ' + chalk.dim('Downloading source archive ' + sourceUrl));      

      return download(sourceUrl, program.cwd);
    });
}
