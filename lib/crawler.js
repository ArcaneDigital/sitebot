const Inherits = require("util").inherits
const Queue = require("./queue")
const Parse = require("./parse")
const Fetch = require("./fetch")
const URI = require("urijs")
const got = require("got")
const Promise = require("bluebird")
const Events = require("events")

const urlFilter = function(url) {
  return !url.match(/\.doc|\.svg|\.json|\.mp4|\.xml|\.pdf|\.jpg|\.jpeg|\.js|\.css|\.gif|\.png$/gi)
}
const contentTypeFilter = function(contentType) {
  if (contentType === undefined) return false
  if (contentType.match(/text\/html/gi)) return true
  return false
}
function Crawler(initialURL) {
  let self = this

  self.initialURL = initialURL

  self._crawled = []

  Events.EventEmitter.call(self)

  self.on("error", function(queueItem, error) {})
  return self
}

Inherits(Crawler, Events)

Crawler.prototype.start = async function() {
  let self = this

  self.emit("start")

  if (self.urlFilter == undefined) self.urlFilter = urlFilter
  if (self.contentTypeFilter == undefined) self.contentTypeFilter = contentTypeFilter
  if (self.interval == undefined) self.interval = 500
  if (self.userAgent == undefined)
    self.userAgent = "Mozilla/5 (compatible; ArcaneSiteCrawler Bot/1.2)"
  if (self.removeQuery == undefined) self.removeQuery = true
  if (self.removeFragment == undefined) self.removeFragment = true
  if (self.decodeResponse == undefined) self.decodeResponse = true
  if (self.gzip == undefined) self.gzip = true
  if (self.validSSL == undefined) self.validSSL = false
  if (self.proxy == undefined) self.proxy = [""]
  if (self.externalLinks == undefined) self.externalLinks = false
  if (self.auth == undefined) self.auth = null
  if (self.restrictPath == undefined) self.restrictPath = "/"
  if (self.depth == undefined) self.depth = Infinity
  if (self.parseBackgroundImages == undefined) self.parseBackgroundImages = false
  if (self.fetchType == undefined) self.fetchType = "raw"
  self.queue = new Queue(self)
  self.fetch = new Fetch(self)

  let queueItem = await self.queue.formatUrl(self.initialURL, undefined)

  await self.queue.add(queueItem)

  do {
    let queueItems = await self.queue.fetch(3)

    try {
      await Promise.map(queueItems, self.crawl.bind(self))
    } catch (e) {}

    await self.queue.clean(self._crawled)
  } while (self.queue.length > 0)
  self.end()
}

Crawler.prototype.end = async function() {
  let self = this
  self.emit("end")
  return Promise.resolve(self)
}

Crawler.prototype.crawl = async function(queueItem) {
  let self = this

  // FILTER URL AND FETCH HEAD
  if (!self.urlFilter(queueItem.href))
    return Promise.reject(new Error()).reflect(`URL Filter - ${queueItem.href}`)

  if (self._crawled.includes(queueItem.href))
    return Promise.reject(new Error()).reflect(`Already Crawled - ${queueItem.href}`)

  self._crawled.push(queueItem.href)
  try {
    const head = await self.fetch.head(queueItem)
    if (!self.contentTypeFilter(head.headers["content-type"])) {
      self.emit("contentFilter", queueItem, { headers: head.headers, statusCode: head.statusCode })
      return Promise.reject(new Error()).reflect(`Content Type Filter - ${queueItem.href}`)
    }

    queueItem = await self.queue.formatUrl(head.url, queueItem.referrer)
    self._crawled.push(queueItem.href)
    self.emit("response", queueItem, { headers: head.headers, statusCode: head.statusCode })
  } catch (e) {
    self.emit("error", queueItem, e.statusCode || "500")
    return Promise.reject(e).reflect()
  }

  // FETCH BODY
  let html = null
  try {
    if (self.fetchType == "emulate") {
      html = await self.fetch.emulate(queueItem)
    } else {
      html = await self.fetch.raw(queueItem)
    }
  } catch (e) {
    self.emit("error", queueItem, e)
    return Promise.reject(e).reflect()
  }
  self.emit("fetched", queueItem, html)

  // PARSE BODY
  const parse = new Parse(self)
  parse.html = html
  parse.url = queueItem.href

  let fetchedResources = parse.findResources()
  self.emit("foundResources", queueItem, fetchedResources)

  // PARSE LINKS TO ADD TO QUEUE
  return await Promise.map(fetchedResources.links, async function(cur) {
    let uri = new URI(cur)
    if (self.removeFragment) uri.fragment("")
    if (self.removeQuery) uri.search("")

    const depth = uri
      .path()
      .replace("/", "")
      .split("/")
      .filter(f => f.length > 1).length

    if (depth > self.depth)
      return Promise.reject(new Error()).reflect(`Path Too Deep - ${queueItem.href}`)

    if (!uri.path().startsWith(self.restrictPath))
      return Promise.reject(new Error()).reflect(`Path Restriction - ${queueItem.href}`)

    if (self._crawled.includes(uri.toString()) || self.queue.includes(uri.toString()))
      return Promise.reject(new Error()).reflect(`Already Found - ${queueItem.href}`)

    let newItem = await self.queue.formatUrl(uri.toString(), queueItem)
    for (let i = 0; i < self.queue.length; i++) {
      if (self.queue[i].href == newItem.href)
        return Promise.reject(new Error()).reflect(`Already In Queue - ${queueItem.href}`)
    }

    await self.queue.add(newItem)

    return Promise.resolve()
  })
}

module.exports = Crawler
