const uuid = require('uuid');
const sinon = require('sinon');
const express = require('express');
const chai = require('chai');
chai.use(require('sinon-chai'));
const {expect} = chai;

const API_PORT = 1797;

const infoCommand = require('../../commands/info');

describe('info command', () => {
  var apiServer;
  var program;
  var apiGetUsage;
  var website;
  const appId = uuid.v4();
  const customerId = uuid.v4();

  before(done => {
    const api = express();

    api.get('/apps/:appId/usage', (req, res, next) => {
      apiGetUsage(req, res, next);
    });

    apiServer = api.listen(API_PORT, done);
  });

  after(done => {
    apiServer.close(done);
  });

  beforeEach(() => {
    website = {
      appId,
      name: 'test-website',
      subscriptionPlan: 'monthly-15',
      urls: {
        production: 'https://www.domain.com',
        test: 'https://www--test.domain.com'
      }
    };

    program = {
      customerId,
      apiUrl: `http://localhost:${API_PORT}`,
      authToken: '23434',
      website
    };
  });

  it('invokes api to get usage', () => {
    const versions = [
      {
        versionId: uuid.v4(),
        name: 'v1',
        metadata: {size: '3MB', fileCount: 10}
      },
      {versionId: uuid.v4(), name: 'v2', metadata: {size: '3MB'}}
    ];

    website.deployedVersions = {
      production: versions[0].versionId,
      test: versions[1].versionId
    };

    apiGetUsage = sinon.spy((req, res) => {
      res.json({
        month: {
          bytesOut: 245345444,
          requestCount: 24536457,
          bytesOutPercentUsed: 21,
          bytesOutQuota: 567058698696
        },
        day: {
          bytesOut: 435345,
          requestCount: 4575658
        }
      });
    });

    return infoCommand(program).then(() => {
      const {args} = apiGetUsage.lastCall;
      expect(args[0].params.appId).to.equal(appId);
    });
  });
});
