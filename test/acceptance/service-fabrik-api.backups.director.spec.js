'use strict';

const _ = require('lodash');
const lib = require('../../lib');
const app = require('../support/apps').external;
const config = lib.config;
const backupStore = lib.iaas.backupStore;

describe('service-fabrik-api', function () {
  describe('backups', function () {
    /* jshint expr:true */
    describe('director', function () {
      const base_url = '/api/v1';
      const authHeader = `bearer ${mocks.uaa.jwtToken}`;
      const backup_guid = '071acb05-66a3-471b-af3c-8bbf1e4180be';
      const space_guid = 'e7c0a437-7585-4d75-addf-aa4d45b49f3a';
      const service_id = '24731fb8-7b84-4f57-914f-c3d55d793dd4';
      const container = backupStore.containerName;
      const blueprintContainer = `${backupStore.containerPrefix}-blueprint`;
      const instance_id = 'ab0ed6d6-42d9-4318-9b65-721f34719499';
      const started_at = '2015-11-18T11-28-42Z';
      const prefix = `${space_guid}/backup`;
      const filename = `${prefix}/${service_id}.${instance_id}.${backup_guid}.${started_at}.json`;
      const pathname = `/${container}/${filename}`;
      const data = {
        backup_guid: backup_guid,
        instance_guid: instance_id,
        service_id: service_id,
        state: 'succeeded',
        logs: []
      };
      const archiveFilename = `${backup_guid}/volume.tgz.enc`;
      const archivePathname = `/${blueprintContainer}/${archiveFilename}`;

      before(function () {
        backupStore.cloudProvider = new lib.iaas.CloudProviderClient(config.backup.provider);
        mocks.cloudProvider.auth();
        mocks.cloudProvider.getContainer(container);
        return mocks.setup([
          backupStore.cloudProvider.getContainer()
        ]);
      });

      after(function () {
        backupStore.cloudProvider = lib.iaas.cloudProvider;
      });

      afterEach(function () {
        mocks.reset();
      });

      describe('#listBackups', function () {
        it('should return 200 OK', function () {
          mocks.uaa.tokenKey();
          mocks.cloudController.getSpaceDevelopers(space_guid);
          mocks.cloudProvider.list(container, prefix, [filename]);
          mocks.cloudProvider.download(pathname, data);
          return chai.request(app)
            .get(`${base_url}/backups`)
            .query({
              space_guid: space_guid
            })
            .set('Authorization', authHeader)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(200);
              const body = [_.omit(data, 'logs')];
              expect(res.body).to.eql(body);
              mocks.verify();
            });
        });
        it('should return 200 OK - with platform', function () {
          mocks.uaa.tokenKey();
          mocks.cloudController.getSpaceDevelopers(space_guid);
          mocks.cloudProvider.list(container, prefix, [filename]);
          mocks.cloudProvider.download(pathname, data);
          return chai.request(app)
            .get(`${base_url}/backups`)
            .query({
              space_guid: space_guid,
              platform: 'cloudfoundry'
            })
            .set('Authorization', authHeader)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(200);
              const body = [_.omit(data, 'logs')];
              expect(res.body).to.eql(body);
              mocks.verify();
            });
        });
        it('should return 200 OK - with random platform defaults to cf', function () {
          mocks.uaa.tokenKey();
          mocks.cloudController.getSpaceDevelopers(space_guid);
          mocks.cloudProvider.list(container, prefix, [filename]);
          mocks.cloudProvider.download(pathname, data);
          return chai.request(app)
            .get(`${base_url}/backups`)
            .query({
              space_guid: space_guid,
              platform: 'random'
            })
            .set('Authorization', authHeader)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(200);
              const body = [_.omit(data, 'logs')];
              expect(res.body).to.eql(body);
              mocks.verify();
            });
        });
      });

      describe('#getBackup', function () {
        it('should return 200 OK', function () {
          mocks.uaa.tokenKey();
          mocks.cloudController.getSpaceDevelopers(space_guid);
          mocks.cloudProvider.list(container, prefix, [filename]);
          mocks.cloudProvider.download(pathname, data);
          return chai.request(app)
            .get(`${base_url}/backups/${backup_guid}`)
            .query({
              space_guid: space_guid
            })
            .set('Authorization', authHeader)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res.body).to.eql(data);
              mocks.verify();
            });
        });
        it('should return 200 OK - with platform', function () {
          mocks.uaa.tokenKey();
          mocks.cloudController.getSpaceDevelopers(space_guid);
          mocks.cloudProvider.list(container, prefix, [filename]);
          mocks.cloudProvider.download(pathname, data);
          return chai.request(app)
            .get(`${base_url}/backups/${backup_guid}`)
            .query({
              space_guid: space_guid,
              platform: 'cloudfoundry'
            })
            .set('Authorization', authHeader)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res.body).to.eql(data);
              mocks.verify();
            });
        });
        it('should return 200 OK - with random platform defaults to cf', function () {
          mocks.uaa.tokenKey();
          mocks.cloudController.getSpaceDevelopers(space_guid);
          mocks.cloudProvider.list(container, prefix, [filename]);
          mocks.cloudProvider.download(pathname, data);
          return chai.request(app)
            .get(`${base_url}/backups/${backup_guid}`)
            .query({
              space_guid: space_guid,
              platform: 'random'
            })
            .set('Authorization', authHeader)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res.body).to.eql(data);
              mocks.verify();
            });
        });
      });

      describe('#deleteBackup', function () {
        it('should return 200 OK', function () {
          mocks.uaa.tokenKey();
          mocks.cloudController.getSpaceDevelopers(space_guid);
          mocks.cloudProvider.list(container, prefix, [filename]);
          mocks.cloudProvider.remove(pathname);
          mocks.cloudProvider.download(pathname, data);
          mocks.cloudProvider.list(blueprintContainer, backup_guid, [archiveFilename]);
          mocks.cloudProvider.remove(archivePathname);
          return chai.request(app)
            .delete(`${base_url}/backups/${backup_guid}`)
            .query({
              space_guid: space_guid
            })
            .set('Authorization', authHeader)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res.body).to.eql({});
              mocks.verify();
            });
        });

        it('should return 200 OK - with platform', function () {
          mocks.uaa.tokenKey();
          mocks.cloudController.getSpaceDevelopers(space_guid);
          mocks.cloudProvider.list(container, prefix, [filename]);
          mocks.cloudProvider.remove(pathname);
          mocks.cloudProvider.download(pathname, data);
          mocks.cloudProvider.list(blueprintContainer, backup_guid, [archiveFilename]);
          mocks.cloudProvider.remove(archivePathname);
          return chai.request(app)
            .delete(`${base_url}/backups/${backup_guid}`)
            .query({
              space_guid: space_guid,
              platform: 'cloudfoundry'
            })
            .set('Authorization', authHeader)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res.body).to.eql({});
              mocks.verify();
            });
        });
        it('should return 200 OK - with random platform defaults to cf', function () {
          mocks.uaa.tokenKey();
          mocks.cloudController.getSpaceDevelopers(space_guid);
          mocks.cloudProvider.list(container, prefix, [filename]);
          mocks.cloudProvider.remove(pathname);
          mocks.cloudProvider.download(pathname, data);
          mocks.cloudProvider.list(blueprintContainer, backup_guid, [archiveFilename]);
          mocks.cloudProvider.remove(archivePathname);
          return chai.request(app)
            .delete(`${base_url}/backups/${backup_guid}`)
            .query({
              space_guid: space_guid,
              platform: 'random'
            })
            .set('Authorization', authHeader)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res.body).to.eql({});
              mocks.verify();
            });
        });
        it('should return 410 Gone', function () {
          mocks.uaa.tokenKey();
          mocks.cloudController.getSpaceDevelopers(space_guid);
          mocks.cloudProvider.list(container, prefix, []);
          return chai.request(app)
            .delete(`${base_url}/backups/01234567-0000-4000-9000-0123456789ab`)
            .query({
              space_guid: space_guid
            })
            .set('Authorization', authHeader)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(410);
              expect(res.body).to.eql({});
              mocks.verify();
            });
        });
      });
    });
  });
});