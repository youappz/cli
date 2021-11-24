const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const config = require('config');
const uuid = require('uuid');
const manifest = require('../lib/manifest');
config.userConfigFile = '.appzrc-test.yml';

const userConfig = require('../lib/user-config');
const {expect} = chai;
const MockApi = require('./mock-api');
const cliInit = require('../lib/cli-init');

describe('cliInit', () => {
  var program;
  var mockApi;

  beforeEach(() => {
    program = {};

    mockApi = new MockApi();
    mockApi.start();
  });

  afterEach(done => {
    mockApi.stop(done);
  });

  it('extends program with userConfig settings', () => {
    return userConfig
      .set({userValue1: 1, userValue2: 2})
      .then(() => cliInit(program, {requireAuth: false}))
      .then(() => {
        expect(program.userValue1).to.equal(1);
        expect(program.userValue2).to.equal(2);
      });
  });

  it('loads website', () => {
    const customerId = uuid.v4();
    const appId = uuid.v4();

    program.cwd = path.join(os.tmpdir(), Date.now().toString());
    program.authToken = '252454334';
    program.customerId = customerId;
    program.customerRoles = {[customerId]: 'admin'};

    const website = {appId, customerId};
    const getWebsite = sinon.spy((req, res) => {
      res.json(website);
    });

    mockApi.registerRoute('get', '/apps/:appId', getWebsite);

    return fs
      .outputFile(path.join(program.cwd, manifest.fileName), 'id: ' + appId)
      .then(() => cliInit(program, {loadWebsite: true}))
      .then(() => {
        expect(getWebsite).to.have.been.calledWith(
          sinon.match({
            params: {appId}
          })
        );

        expect(program.website).to.eql(website);
      });
  });
});
