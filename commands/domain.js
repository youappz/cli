// Register a custom domain for a website
const chalk = require('chalk');
const _ = require('lodash');
const log = require('winston');
const wordwrap = require('wordwrap');
const urlJoin = require('url-join');
const output = require('../lib/output');
const api = require('../lib/api');

const DNS_SETUP_URL = 'http://bit.ly/2ll4B0c';
const SUPPORT_EMAIL = 'support@youappz.com';

module.exports = program => {
  // Validate that the domain name is valid.
  if (_.isString(program.name)) {
    return registerDomain(program);
  }

  // If the command is run without a name arg then check the status of the domain
  return domainStatus(program);
};

function registerDomain(program) {
  output.blankLine();
  
  // Check if the current website already has a custom domain.
  if (!_.isEmpty(program.website.domain)) {
    const subDomain = ['@','*'].includes(program.website.domain.subDomain) ? '' : program.website.domain.subDomain + '.'
    return Promise.reject(
      Error.create(
        'This website is already bound to the custom domain ' +
          chalk.yellow(`${subDomain}${program.website.domain.name}`),
        {formatted: true}
      )
    );
  }

  // Cursory check that the domain name looks ok.
  if (!/^[.a-z0-9_-]+$/.test(program.name)) {
    return Promise.reject(
      Error.create('Domain name has invalid characters', {formatted: true})
    );
  }

  if (_.isEmpty(program.subdomain)) {
    return Promise.reject(
      Error.create('Missing --subdomain argument.', {formatted: true})
    );
  }

  if (
    program.subdomain !== '@' &&
    program.subDomain !== '*' &&
    !/^[a-z0-9-]{2,50}$/.test(program.subdomain)
  ) {
    return Promise.reject(
      Error.create(
        'Invalid sub-domain. Valid characters are ' +
          'letters, numbers, and dashes.',
        {formatted: true}
      )
    );
  }

  output('Register custom domain ' + chalk.bold(program.name));
  output.blankLine();
  
  return createDomain(program)
    .then(domain => {
      // Update the application with the domain name.
      log.info(
        'Updating website %s to custom domain %s',
        program.website.appId,
        program.name
      );

      

      return api
        .put({
          url: urlJoin(program.apiUrl, `/apps/${program.website.appId}`),
          authToken: program.authToken,
          body: {
            domainName: program.name,
            subDomain: program.subdomain,
            zoneId: domain.zoneId,
            recordId:domain.recordId
          }
        })
        .then(() => domain);
    })
    .then(domain => {
      displayNextSteps(domain);
      return domain;
    });
}

function domainStatus(program) {
  output.blankLine();
  if (_.isEmpty(program.website.domain)) {
    return noCustomDomainMessage();
  }

  
  // Make api call to create the domain.
  return api
    .get({
      url: urlJoin(
        program.apiUrl,
        `/apps/${program.website.appId}/domains?` +
          `domainName=${encodeURIComponent(program.website.domain.name)}`
      ),
      authToken: program.authToken
    })
    .then(domain => {
      let sitezDomain = `${program.website.domain.subDomain}.${program.website.domain.name}`
      sitezDomain = sitezDomain.replace('@.','')
      output(chalk.dim('Domain name:'));
      output('    ' + chalk.bold(sitezDomain));
      output.blankLine();
      
      
      switch (domain.status.toUpperCase()) {
        case 'PENDING':
          output(chalk.dim('Domain status:'));

          if(domain.original_registrar == null) {
            output(
              wordwrap(4, 45)(
                `1. Log in to your Registrar Account ` +
                " Determine your registrar via " + 
                chalk.underline(`https://whois.icann.org/en/lookup?name=${domain.domainName}`)
              )
            );
            output.blankLine();
            output(
              wordwrap(4, 80)(
                'Remove these nameservers:'
              )
            );

          } else {
            output(
              wordwrap(4, 80)(
                `1. Log in to your ${domain.original_registrar} Account` +
                " Remove these nameservers:"
              )
            );
          }
          output.blankLine();
          output('    ' + chalk.yellow(domain.original_name_servers[0]) + '.');
          output.blankLine();
          output('    ' + chalk.yellow(domain.original_name_servers[1]) + '.');
          output.blankLine();


            output(
              wordwrap(4, 80)(
                '2. Replace with the below nameservers'
              )
            );

            output.blankLine();
            output('    ' + chalk.yellow(domain.name_servers[0]) + '.');
            output.blankLine();
            output('    ' + chalk.yellow(domain.name_servers[1]) + '.');
            output.blankLine();
          
          output.blankLine();
          output(
            wordwrap(4, 80)(
              "If you need assistance, don't hesitate to contact us at " +
                chalk.underline(SUPPORT_EMAIL)
            )
          );
          break;

        case 'ACTIVE':
          // output(chalk.dim('DNS Value:'));
          // output('    ' + domain.dnsValue);
          // output.blankLine();
          
          output(chalk.dim('Domain status:'));
          output(
            wordwrap(4, 80)(
              'Your SSL certificate and CDN distribution are fully provisioned.' +
                'your website is now powered by Youappz Sitez:'
            )
          );
          output.blankLine();
          output(
            wordwrap(4, 80)(
              'Visit your website at ' +
                chalk.yellow(`https://${sitezDomain}`))
          );
          output.blankLine();
          output(
            wordwrap(4, 80)(
              'Contact ' +
                chalk.underline(SUPPORT_EMAIL) +
                ' if you need any assistance.'
            )
          );

          break;
        default:
          output('    Unknown domain status ' + domain.status);
          break;
      }
      output.blankLine();
      return null;
    });
}

function noCustomDomainMessage() {
  output('This website does not have a custom domain.');
  output(
    'You can register one by running ' +
      output.command('appz domain --name yourdomain.com')
  );
  output.blankLine();
  return Promise.resolve(null);
}

function createDomain(program) {
  // Make api call to create the domain.
  
  return api
    .post({
      url: urlJoin(program.apiUrl, `/apps/${program.website.appId}/domains`),
      authToken: program.authToken,
      body: {
        domainName: program.name,
        subDomain: program.subdomain
      }
    })
    .catch(error => {
      if (error.status === 400) {
        throw Error.create(error.message, {formatted: true});
      }
      throw error;
    });
}

function displayNextSteps() {
  // Display next steps to the user.
  output(
    wordwrap(4, 80)(
      'Please run ' +
        output.command('appz domain') +
        ' (with no arguments) in about 30 seconds. You will be presented with ' +
        'the CNAME you need to create to validate domain ownership. Once this CNAME is detected the ' +
        'provisioning of your SSL certificate and CDN distribution will start.'
    )
  );

  output.blankLine();

  output(
    wordwrap(4, 80)(
      "If you need any assistance, don't hesitate to contact us at " +
        chalk.underline(SUPPORT_EMAIL)
    )
  );
  output.blankLine();
}
