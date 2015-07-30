var node_xj = require("xlsx-to-json");
var fs = require('fs');

var libModule = function(app, config){

  var prepLinkify = function(context){
    return function(sheet){
      return "<a href=/"+context.mountPoint+'/'+sheet+">"+sheet+"</a>";
    }
  };

  var init = function(){
    this.config = config
    this.app = app
    this.dataDir = './'+this.config.dataDir;
    this.xlsxSource = this.dataDir+'/'+this.config.xlsxSource;
    this.sheets = this.config.sheets;
    this.mountPoint = this.config.mountPoint || 'data';
  }.apply(this);

  this.linkify = prepLinkify(this);

  this.registerMountPoint = function(){
    var dataLinks = this.dataLinkHelper();
    app.get('/'+this.mountPoint, function(req, res) {
      res.send(dataLinks);
    });
  };

  this.dataLinkHelper = function(){
    return '<strong>Exposed Endpoints at</strong>:<br/>'+ this.sheets.map(this.linkify).join('<br/>')
  };

  this.read_xls = function(source_file, sheetName){
    var that = this;
    return new Promise(function(resolve, reject) {
      node_xj({
        input: source_file,
        output: './'+that.dataDir+"/"+sheetName+".json",
        sheet: sheetName
      }, function(err, result) {
        if(err) {
          reject(err);
          console.error(err);
        }else{
          resolve(sheetName);
        }
      });
    });
  };

  this.setDataRoute = function(sheet){
    var jsonFile = this.dataDir+'/'+sheet
    var mount = '/'+this.mountPoint+'/'+sheet
    app.get(mount, function(req, res) {
      res.send(require(jsonFile));
    });
  };

  this.expandSpreadsheet = function(){
    var that = this;
    return new Promise(function(resolve){
      for(var i=0; i<that.sheets.length; i++){
        var sheet = that.sheets[i];
        var completedCount = 0;
        var outerResolution = resolve;
        that.read_xls(that.xlsxSource, sheet).then(function(sheetName){
          var jsonFile = that.dataDir+'/'+sheetName
          return new Promise(function(resolve, reject){
            fs.exists(jsonFile+'.json', function(exists){
              if(exists){
                that.setDataRoute(sheetName);
                completedCount++;
                resolve(sheetName);
              }else{
                reject(this)
              }
              if(completedCount === that.sheets.length){
                outerResolution(that);
              }
            });
          });
        });
      }
    });
  };

  this.clearData = function(){
    for(var i=0; i<this.sheets.length; i++){
      var sheet = this.sheets[i];
      fs.unlinkSync(this.dataDir+'/'+sheet+'.json');
    }
  };

  this.register = function(){
    var that = this;
    return new Promise(function(resolve){
      if (!fs.existsSync(that.dataDir)){
        fs.mkdirSync(that.dataDir);
      }
      that.expandSpreadsheet().then(function(){
        that.registerMountPoint();
        resolve(that);
      });
    });
  };
}

module.exports = function(app, config) {
  return new libModule(app, config)
}
