const fs = require('fs'),
  http = require('http'),
  toMarkdown = require('to-markdown'),
  cheerio = require('cheerio'),
  Connection = require('tedious').Connection,
  Request = require('tedious').Request,
  config = require('./config.json');

//const config = {
//  userName: '',
//  password: '',
//  server: '',
//
//  options: {
//    encrypt: true,
//    rowCollectionOnRequestCompletion: true,
//    database: ''
//  }
//};

var connection = new Connection(config);

connection.on('connect', function (err) {
  if (!err) {
    executeStatement();
  }
});

function executeStatement() {
  request = new Request('select [id] from [dbo].[journal] order by [id]', function (err, rowCount, rows) {
    if (err) {
      console.log(err);
    } else {
      console.log(rowCount + ' rows');
      for (var i = 0; i < rowCount; i++) {
        //      for (var i = rowCount - 1; i < rowCount; i++) {
        var myId = rows[i][0].value;
        http.get('http://www.s-church.net/Blog/Entry/' + myId, (res) => {
          //          console.log(`Got response: ${res.statusCode}`);
          // consume response body
          var data = '';
          res.on('data', function (chunk) {
            data += chunk;
          });
          res.on('end', function (chunk) {
            var $ = cheerio.load(data);

            var tags = [];
            $('.tags ul li').each(function () {
              tags.push($(this).text().trim());
            });

            $('.clear').remove();
            $('.entry_links').remove();
            $('.comments').remove();

            var $entry = $('.blog_entry');

            var dataId = $entry.attr('data-blogid');
            var title = $entry.find('h3 a').text();
            var permalink = $entry.find('h3 a').attr('href');
            var entryDate = $entry.find('h4').attr('data-entry-date');

            //            console.log($entry.html());

            var markdown = toMarkdown($entry.find('.entry').html());

            var tagsFront = '';
            if (tags.length > 0) {
              tagsFront = 'tags:\n';
              for (var j = 0; j < tags.length; j++) {
                tagsFront += '- ' + tags[j] + '\n';
              }
            }

            markdown = 'title: ' + title + '\n' +
              'date: ' + entryDate + '\n' +
              'id: ' + dataId + '\n' +
              tagsFront +
              '---\n' +
              markdown;

            fs.writeFile('posts/' + dataId + '.md', markdown, (err) => {
              if (err) throw err;
              //              console.log('It\'s saved!');
              console.log(`Saved ${dataId}.md - ${entryDate} - ${title}`);
              res.resume();
            });
          });

        }).on('error', (e) => {
          console.log(`Got error: ${e.message}`);
        });
      }
    }
    //    process.exit();
  });

  connection.execSql(request);
}
