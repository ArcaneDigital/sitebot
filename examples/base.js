const Crawler = require("sitebot")

const crawler = new Crawler({ url: "http://example.com" })

crawler.on("start", function() {
  console.log("starting crawl")
})

crawler.on("response", function(queueItem, response) {
  console.log(`Found ${queueItem.href}`)
})

crawler.on("end", function() {
  console.log(`Finished Crawl`)
})

crawler.start()
