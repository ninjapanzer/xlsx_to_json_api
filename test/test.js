var lib = require('../index');
var assert = require("assert");
var MockExpress = require('mock-express');
var express = require('express');
var fs = require('fs')
var testLib = {};

var stdErr = function(err){console.log(err.stack)}

describe('xlsx_to_json_lib', function() {
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
