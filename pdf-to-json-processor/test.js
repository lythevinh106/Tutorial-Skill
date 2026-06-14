const md = require('markdown-it')({html: true}).use(require('markdown-it-mark')); console.log(md.render('==<table border=\" "1\>=='));  
