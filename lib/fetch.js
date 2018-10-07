const got = require("got")
const Promise = require("bluebird")
const URI = require("urijs")

const Fetch = function(c) {
  let self = this
  self.crawler = c
  self.options = {
    method: "GET",
    resolveWithFullResponse: true,
    followAllRedirects: true,
    maxRedirects: 5,
    auth: c.auth,
    proxy: c.proxy[Math.floor(Math.random() * c.proxy.length)],
    headers: {
      "User-Agent": c.userAgent,
      Referer: "",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  }

  return self
}

Fetch.prototype.head = async function(queueItem) {
  let self = this
  try {
    if (self.crawler.fetchType == "raw") {
      let head = await got.head(URI.build(queueItem), self.options)

      return Promise.resolve(head)
    } else if (self.crawler.fetchType == "emulate") {
      let head = await got.head(URI.build(queueItem), self.options)

      return Promise.resolve(head)
    }
  } catch (e) {
    return Promise.reject(e)
  }
}

Fetch.prototype.raw = async function(queueItem) {
  let self = this
  let data = await got.get(URI.build(queueItem), self.options)

  return Promise.resolve(data.body)
}

module.exports = Fetch
