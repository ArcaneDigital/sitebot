"use strict"
const cheerio = require("cheerio")
const URI = require("urijs")
const Promise = require("bluebird")

var crawler = null
function Parse(c) {
  let self = this
  crawler = c
  self.externalLinks = crawler.externalLinks || false
  self.parseBackgroundImages = crawler.parseBackgroundImages || false
  self.html = self.html || undefined
  self.url = self.url || undefined
}

Parse.prototype.extractCSS = function(links) {
  let css = []
  return promise
    .map(links, function(link) {
      return rp(link.src).then(function(htmlString) {
        css.push(htmlString)
      })
    })
    .then(function() {
      return css.join(" ")
    })
}

Parse.prototype.externalLink = function(queueItem, link) {
  let ref = new URI(queueItem)
  let ext = new URI(link)
  crawler.emit("externalLink", ref.toString(), ext.toString())
}
Parse.prototype.findResources = function() {
  let self = this

  crawler.emit("sourceCode", self.url, self.html)
  const $ = cheerio.load(self.html)
  let absoluteFrom = self.url
  if ($("base").length > 0) absoluteFrom = $("base").attr("href") || self.url
  var links = []

  $("a[href]").each(function(index, item) {
    let inLink = $(item)
      .attr("href")
      .match(/mailto:|mail:|tel:|wtai:|fax:|sms:/gi)
    if (inLink) return true

    try {
      let link = URI.parse(
        URI(
          $(item)
            .attr("href")
            .trim()
        )
          .absoluteTo(absoluteFrom)
          .normalize()
          .href()
      )
      let referrer = URI.parse(self.url)
      if (link.hostname.replace(/^www./, "") == referrer.hostname.replace(/^www./, "")) {
        links.push(URI.build(link))
      } else {
        self.externalLink(referrer, link)
      }
    } catch (e) {}
  })

  $("form[action]").each(function(index, item) {
    let inLink = $(item)
      .attr("action")
      .match(/mailto:|tel:|wtai:|sms:/gi)
    if (inLink) return true

    let link = URI.parse(
      URI(
        $(item)
          .attr("action")
          .trim()
      )
        .absoluteTo(absoluteFrom)
        .normalize()
        .href()
    )
    let referrer = URI.parse(self.url)
    if (link.hostname.replace(/^www./, "") == referrer.hostname.replace(/^www./, "")) {
      links.push(URI.build(link))
    } else {
      self.externalLink(referrer, link)
    }
  })
  links = [...new Set(links)]

  var images = []
  $("img").each(function(index, item) {
    try {
      let image = URI(
        $(item)
          .attr("src")
          .trim()
      )
        .absoluteTo(absoluteFrom)
        .normalize()
        .href()

      images.push(image)
    } catch (e) {}
  })

  if (self.parseBackgroundImages) {
    $("*").each(function(index, item) {
      const bg = $(item).css("background-image")
      if (bg) {
        let image = URI(bg.replace(/.*\s?url\([\'\"]?/, "").replace(/[\'\"]?\).*/, ""))
          .absoluteTo(absoluteFrom)
          .normalize()
          .href()
        images.push(image)
      }
    })
  }
  images = [...new Set(images)]

  return { links, images }
}

module.exports = Parse
