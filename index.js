const Crawler = require("./lib/crawler.js")
const { URL } = require("url")

const crawler = function(options) {
  if (!options.url) throw "URL is required"
  try {
    const crawlUrl = new URL(options.url)
    return new Crawler(crawlUrl.href)
  } catch (e) {
    console.log(e)
    throw "Invalid URL format"
  }
}

module.exports = crawler
