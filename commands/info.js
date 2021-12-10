const chalk = require('chalk');
const _ = require('lodash');
const urlJoin = require('url-join');
const fileSize = require('filesize');
const commaNumber = require('comma-number');

const output = require('../lib/output');
const api = require('../lib/api');
const urls = require('../lib/urls');

module.exports = program => {
  output.blankLine();
  output(chalk.underline('Name:'));
  output('    ' + program.website.name);

  output.blankLine();
  output(chalk.underline('Website ID:'));
  output('    ' + program.website.appId);

  output.blankLine();
  output(chalk.underline('Account ID:'));
  output('    ' + program.website.customerId);

  // Display the URLs of all deployed stages
  output.blankLine();
  output(chalk.underline('URLs:'));
  const stages = Object.keys(program.website.urls);
  stages.forEach(stage => {
    output(
      '    ' +
        _.padEnd(stage, 15, ' ') +
        ' => ' +
        chalk.underline.yellow(program.website.urls[stage])
    );
  });

  if (_.isArray(program.website.clientIpRange)) {
    output.blankLine();
    output(chalk.underline('Client IP Range:'));
    output('   ' + program.website.clientIpRange.join(', '));
  }

  output.blankLine();

};

function displayUsage(program) {
  return api
    .get({
      url: urlJoin(program.apiUrl, `/apps/${program.website.appId}/usage`),
      authToken: program.authToken
    })
    .then(usage => {
      output.blankLine();
      output(chalk.underline('Usage:'));
      output(
        '      Day: ' +
          fileSize(usage.day.bytesOut) +
          ' data out | ' +
          commaNumber(usage.day.requestCount) +
          ' requests'
      );
      output(
        '    Month: ' +
          fileSize(usage.month.bytesOut) +
          ' data out | ' +
          commaNumber(usage.month.requestCount) +
          ' requests'
      );
      if (_.isEmpty(program.website.subscriptionPlan)) {
        output(
          '    Quota: ' +
            usage.day.bytesOutPercentUsed +
            '% of ' +
            fileSize(usage.day.bytesOutQuota) +
            ' daily data transfer used'
        );
      } else {
        output(
          '    Quota: ' +
            usage.month.bytesOutPercentUsed +
            '% of ' +
            fileSize(usage.month.bytesOutQuota) +
            ' monthly data transfer used'
        );
      }
      output.blankLine();
    });
}
