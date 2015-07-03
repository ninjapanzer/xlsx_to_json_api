var node_xj = require("xlsx-to-json");
var fs = require('fs');

module.exports = function(app, config) {
  var dataDir = config.dataDir;

  if (!fs.existsSync(dataDir)){
      fs.mkdirSync(dataDir);
  }

  var xlsxSource = dataDir+'/'+config.xlsxSource;

  var sheets = config.sheets;

  var linkify = function(sheet){
    return "<a href=/"+sheet+">"+sheet+"</a>";
  }

  app.get('/', function(req, res) {
    res.send('<strong>Exposed Endpoints at</strong>:<br/>'+ sheets.map(linkify).join('<br/>'));
  });

  var read_xls = function(source_file, sheetName){
    node_xj({
      input: source_file,
      output: "data/"+sheetName+".json",
      sheet: sheetName
    }, function(err, result) {
      if(err) {
        console.error(err);
      }
    });
  }

  var setDataRoute = function(sheet){
    app.get('/'+sheet, function(req, res) {
      data = require(dataDir+'/'+sheet);
      res.send(data);
    });
  }

  for(var i=0; i<sheets.length; i++){
    var sheet = sheets[i];
    read_xls(xlsxSource, sheet);
    setDataRoute(sheet);
  }
}
