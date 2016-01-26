const fs = require('fs'),
      http = require('http'),
      toMarkdown = require('to-markdown'),
      cheerio = require('cheerio');

http.get('http://www.s-church.net/Blog/Entry/30494', (res) => {
  console.log(`Got response: ${res.statusCode}`);
  // consume response body
    var data = '';
    res.on('data', function(chunk) {
        data += chunk;
    });
    res.on('end', function(chunk) {
      var $ = cheerio.load(data);

    var markdown = toMarkdown($('.blog_entry').html());
    console.log(markdown);
    fs.writeFile('message.txt', markdown, (err) => {
      if (err) throw err;
      console.log('It\'s saved!');
      res.resume();
    });

      res.resume();
    });

}).on('error', (e) => {
  console.log(`Got error: ${e.message}`);
});

