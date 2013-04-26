var url = require('url')
document.body.innerHTML = JSON.stringify(url.parse(window.location.href))