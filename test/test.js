var lib = require('../index');
var assert = require("assert");
var MockExpress = require('mock-express');
var express = require('express');
var fs = require('fs')
var mv = require('mv');
var cp = require('cp');
var testLib = {};

var stdErr = function(err){console.log(err.stack)}

describe('xlsx_to_json_lib', function() {
  beforeEach(function(){
    cp.sync('./test/fixtures/deathDatasets.xlsx', './test/data/deathDatasets.xlsx', stdErr);
    cp.sync('./test/fixtures/emptyDeathDatasets.xlsx', './test/data/emptyDeathDatasets.xlsx', stdErr);
  });
  afterEach(function(){
    fs.unlinkSync('./test/data/deathDatasets.xlsx');
    fs.unlinkSync('./test/data/emptyDeathDatasets.xlsx');
  });
  describe('config', function(){
    beforeEach(function(){
      testLib = lib({get:function(){}}, {
        sheets: ['what'],
        xlsxSource: 'deathDatasets.xlsx',
        dataDir: 'data',
        mountPoint: 'butt'
      });
    });

    it('should capture sheetnames', function(){
      assert.deepEqual(testLib.sheets, ['what']);
    });

    it('should capture xlsxSource', function(){
      assert.equal(testLib.xlsxSource, './data/deathDatasets.xlsx');
    });

    it('should capture base dataDir', function(){
      assert.equal(testLib.dataDir, './data');
    });

    it('should capture express mountPount', function(){
      assert.equal(testLib.mountPoint, 'butt');
    });
  });

  describe('link building', function () {
    beforeEach(function(){
      testLib = lib({get:function(){}}, {
        sheets: ['what'],
        xlsxSource: 'deathDatasets.xlsx',
        dataDir: 'data',
        mountPoint: 'butt'
      });
    });

    it('should make links', function(){
      assert.equal(testLib.linkify('what'), "<a href=/butt/what>what</a>");
    });

    it('should make an index for the mountpoient', function(){
      assert.equal(testLib.dataLinkHelper(), "<strong>Exposed Endpoints at</strong>:<br/><a href=/butt/what>what</a>");
    });
  });

  describe('reloading expanded data',function(){
    var registration = {};
    var theData = "";
    var req = function(){};
    var res = { send: function(data){ theData = data; } }
    beforeEach(function(){
      var app = MockExpress();
      testLib = lib(app, {
        sheets: ['buffy'],
        xlsxSource: 'deathDatasets.xlsx',
        dataDir: 'test/data',
        mountPoint: 'butt'
      });
      registration = testLib.register();
    });

    describe('does not reprocess files if they are the same version', function(){
      after(function(){
        testLib.clearData();
      });

      it('if server is started twice', function(done){
        var buffyFileModTime;
        registration.then(function(lib){
          var jsonFile = lib.dataDir+'/buffy.json'
          fs.stat(jsonFile, function(err, stats){
            buffyFileModTime = stats.mtime.getTime();
            testLib.register().then(function(){
              fs.stat(jsonFile, function(err, stats){
                assert.equal(stats.mtime.getTime(), buffyFileModTime);
                done()
              });
            });
          });
        });
      });

      it('still loads data from endpoint', function(done){
        registration.then(function(lib){
          var jsonFile = lib.dataDir+'/buffy.json'
          lib.app.invoke('get', '/butt/buffy', req, res);
          assert.equal(typeof(theData), 'object');
          assert.equal(Array.isArray(theData), true);
          assert.equal(theData[0].episode, 6)
          return done();
        }, stdErr);
      });
    });

    describe('reprocesses files if the source data changes', function(){
      var endpointVersionsOrig;

      afterEach(function(){
        testLib.clearData();
      });

      it('tracks the file change', function(done){
        registration.then(function(lib){
          var versionFile = lib.dataDir+'/endpointVersions.json'
          endpointVersionsOrig = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
        }).then(function(){
          cp.sync('./test/fixtures/emptyDeathDatasets.xlsx', './test/data/deathDatasets.xlsx', stdErr);
        }).then(function(){
          lib(MockExpress(), {
            sheets: ['buffy'],
            xlsxSource: 'deathDatasets.xlsx',
            dataDir: 'test/data',
            mountPoint: 'butt'
          }).register().then(function(lib){
            var versionFile = lib.dataDir+'/endpointVersions.json'
            var endpointVersions = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
            assert.equal(endpointVersions.version !== endpointVersionsOrig.version, true);
            fs.exists(versionFile, function(exists){ assert.equal(exists, true) });
            lib.app.invoke('get', '/butt/buffy', req, res);
            assert.equal(theData[0].episode, 6)
            return done()
          }, stdErr);
        });
      });
    });

    describe('should create files', function(){
      afterEach(function(){
        testLib.clearData();
      });

      it('when first loaded', function(done){
        registration.then(function(lib){
          var jsonFile = lib.dataDir+'/buffy.json'
          fs.exists(jsonFile, function(exists){
            assert.equal(exists, true);
            done();
          });
        });
      });

      it('creates version file', function(done){
        registration.then(function(lib){
          var versionFile = lib.dataDir+'/endpointVersions.json'
          fs.exists(versionFile, function(exists){
            assert.equal(exists, true);
            done();
          });
        });
      });
    });
  });

  describe('applying expands data',function(){
    var app = {};
    var theData = "";
    var registration = {};
    var req = function(){};
    var res = { send: function(data){ theData = data; } }
    beforeEach(function(){
      app = MockExpress();
      testLib = lib(app, {
        sheets: ['up', 'dawn'],
        xlsxSource: 'deathDatasets.xlsx',
        dataDir: 'test/data',
        mountPoint: 'butt'
      });
      registration = testLib.register();
    });

    afterEach(function(){
      testLib.clearData();
    });

    it('should register json data endpoint', function(done){
      registration.then(function(lib){
        lib.app.invoke('get', '/butt/up', req, res);
        assert.deepEqual(theData, [{}]);
        return done();
      }, stdErr);
    });

    it('should register mounts index', function(done){
      registration.then(function(lib){
        lib.app.invoke('get', '/butt', req, res);
        assert.equal(theData, "<strong>Exposed Endpoints at</strong>:<br/><a href=/butt/up>up</a><br/><a href=/butt/dawn>dawn</a>");
        return done();
      }, stdErr);
    });
  });
});
