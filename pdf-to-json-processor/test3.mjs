import MarkdownIt from 'markdown-it'; const md = new MarkdownIt({html: true}); console.log(md.render('<table><tr><th><mark>Order No</mark></th></tr></table>'));  
