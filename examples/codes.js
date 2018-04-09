const Crawler = require("sitebot")

const crawler = new Crawler({ url: "http://the-internet.herokuapp.com/status_codes" })

const URLs = {}

crawler.on("end", function() {
  console.log(URLs)
})

crawler.on("response", function(queueItem, response) {
  if (!URLs[response.statusCode]) URLs[response.statusCode] = []
  URLs[response.statusCode].push(queueItem.href)
})

crawler.on("error", function(queueItem, error) {
  if (!URLs[error]) URLs[error] = []
  URLs[error].push({
    href: queueItem.href,
    referrer: queueItem.referrer.href
  })
})

crawler.start()
