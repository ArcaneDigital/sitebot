const got = require("got")
const Promise = require("bluebird")
const puppeteer = require("puppeteer")
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

Fetch.prototype.emulate = async function(queueItem) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--no-sandbox`, `--disable-setuid-sandbox`, `--disk-cache-size=0`]
  })
  let response = ""
  try {
    const pages = await browser.pages()
    const page = pages[0]

    await page.emulate({
      viewport: {
        width: 1280,
        height: 1024
      },
      deviceScaleFactor: 1,
      userAgent: `Mozilla/5.0 (compatible; SiteBot/2.1; Full; (KHTML, like Gecko) Chrome/61.0.3163.79)`
    })

    await page.goto(URI.build(queueItem), { timeout: 300000, waitUntil: "load" })
    response = await page.content()
    browser.close()
    return Promise.resolve(response)
  } catch (e) {
    browser.close()
    return Promise.reject(e)
  }
}
module.exports = Fetch
