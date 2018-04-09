const util = require("util")

const Promise = require("bluebird")
const URI = require("urijs")

var crawler = null
const Queue = function(c) {
  let self = this
  crawler = c
  self.initialURL = c.initialURL
  Array.call(Queue)
  return self
}

util.inherits(Queue, Array)

Queue.prototype.add = async function(queueItem) {
  let self = this

  queueItem.status = "queued"

  self.push(queueItem)

  crawler.emit("queueAdd", queueItem.href)

  return Promise.resolve()
}

Queue.prototype.get = async function() {
  let self = this
  if (self.length == 0) return Promise.resolve(null)

  return Promise.resolve(self.pop())
}

Queue.prototype.fetch = async function(count) {
  let self = this
  if (self.length == 0) return Promise.resolve(null)

  return Promise.resolve(self.splice(0, count || 1))
}
Queue.prototype.clean = async function(crawled) {
  let self = this
  const tempQ = []
  const newQ = []
  for (let i = 0; i < self.length; i++) {
    if (!crawled.includes(self[i].href) && !tempQ.includes(self[i].href)) {
      tempQ.push(self[i].href)
      newQ.push(self[i])
    }
  }
  self = newQ
  return Promise.resolve(self)
}
Queue.prototype.formatUrl = async function(url, referrer) {
  let self = this

  let ref = undefined
  if (typeof referrer !== "object") {
    ref = { href: self.initialURL }
  } else {
    ref = { href: referrer.href }
  }
  if (!url || url.trim().length == 0) {
    return false
  }

  if (!/^https?\:\/\//.test(url)) {
    url = "http://" + url
  }
  uri = URI.parse(
    URI(url)
      .absoluteTo(ref.href)
      .normalize()
      .href()
  )
  uri.href = URI.build(uri)
  uri.referrer = ref
  return Promise.resolve(uri)
}

module.exports = Queue
