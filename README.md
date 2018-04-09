# Website Crawler for node

SiteBot is an event driven website crawler.

## Documentation

* [Installation](#installation)
* [Getting started](#getting-started)
* [Configuration](#configuration)
* [FAQ/Troubleshooting](#faqtroubleshooting)
* [Examples](#examples)
* [Node Support](#node-support)
* [Maintainers](#maintainers)
* [License](#license)

## Installation

`npm install sitebot`

## Getting Started

```js
const Crawler = require("sitebot")

const crawler = new Crawler({ url: "http://www.example.com/" })

crawler.start()
```

## Events

SiteBot is purely event driven, once the crawl starts, all interaction will be through events that are fired. They include:

* `start()`
* `end()`
* `fetched(queueItem, url)`
* `queueAdd(url)`
* `foundResource(queueItem, resources)`
* `externalLink(queueItem, externalLink)`
* `response(queueItem, response)`
* `error(queueItem, error)`
* `sourceCode (url, html)`
* `contentFilter (queueItem, header)`

## Configuration

* `crawler.interval = 500` - The amount of time SiteBot will delay between requests.

* `crawler.userAgent = "Mozilla/5.0 (compatible; SiteBot/2.1; Full; (KHTML, like Gecko) Chrome/61.0.3163.79)"` - The user agent the crawler will report.

* `crawler.removeQuery = true` - By default SiteBot will strip out an query string parameters from a URL.

* `crawler.externalLinks = false` - Whether you want to crawl external links as well as internal. (Be careful with this setting as it could mean crawling the entire internet since if are no other bounds put on crawler)

* `crawler.proxy = null` - The crawler should use an HTTP proxy to make its requests. Provide full host and port of proxy. ex. `http://user:pass@example.com:8332`

* `crawler.depth = 6` - The number of directories deep the crawler will venture. For the homepage only use 0, for the homepage and top level pages use 1 etc.

* `crawler.validSSL = false` - Allow crawling of pages with an invalid SSL Certificate. If you are still having issues with invalid SSL's, try setting the environment variable NODE_TLS_REJECT_UNAUTHORIZED to '0'.

* `crawler.fetchType = 'raw'` - When fetching the page content there are two options. `raw` uses a simple curl-like command to grab the source code. It is quicker but cannot crawl any links/content rendered through Javascript. The other option is `emulate`, this uses a headless Chrome browser to render the page. It is slower (half the speed) but allows for crawling of client side content.

* `crawler.auth = {user: "your_user", pass: "your_secret"}` - Allows crawling of pages hidden behind password protection using htaccess

* `crawler.restrictPath = '\'` - By default SiteBot will only crawl subpages of the starting URL. You can expand this, or restrict it even furthing by adding in a different path that you want the crawler to stick to.

* `crawler.parseBackgroundImages = false` - The parsing of background images to be included in the foundResource event can be a time/resource intensive operation. By default it is turned off.

* `crawler.urlFilter = function(url) { return true }` - Custom filtering of URLs to crawl, true will allow a crawl, false will exclude.

* `crawler.contentTypeFilter = function(contentType) { return true }` - Custom filtering of URLs to crawl based on Content Type. A head operation is performed to retrieve the Content Type.

## The Queue

### Queue items

These are the properties for every item in the queue:

* `href` - The complete URL of the resource
* `protocol` - The protocol (http/https) of the resource
* `hostname` - The domain or hostname of the resource
* `port` - The port of the resource
* `path` - The full path including queryString
* `username` - The username for the request if included
* `password` - The password for the request if included
* `referrer` - Object. If it is the first page or a referrer cannot be determined it will use it's own URL.
  * `href` - https://www.example.com'

## Roadmap

* Standardize URL structure internally to be more consistent
* Cookies
* Saving and resuming crawls
* Crawling statistics
* Manually adding to Queue
* Custom resource discovering

## Examples

See the `examples` folder for examples of how to use SiteBot.

### Event Examples

Collect URLs and response codes into an object

```js
let URLs = {}
crawler.on("response", function(queueItem, response) {
  if (!URLs[response.statusCode]) URLs[response.statusCode] = []
  URLs[response.statusCode].push(queueItem.href)
})

crawler.on("error", function(queueItem, error) {
  const status = error.code || error.statusCode || error.response.statusCode
  if (!URLs[status]) URLs[status] = []
  URLs[status].push({
    href: queueItem.href,
    referrer: queueItem.referrer.href
  })
})
crawler.on("end", function() {
  console.log(URLs)
})
```

## Node Support

Prior to version 2 SiteBot supported any of the current stable and LTS versions of Node. From version 2.0 and onward, Node 8+ is required:

* 4.x (v1)
* 5.x (v1)
* 6.x (v1)
* 7.x (v1)
* 8.x (v2)
* 9.X (v2)

## Known issues

* ~~On larger crawls (100+ pages) duplicates occur in found pages.~~
* The `error` event is inconsistent in the return value format. Check in the [Examples](#examples) section for some code to deal with it
* Variable/Event naming conventions not as consistent as I would like
* Script will attempt to parse PDF files unless told otherwise. This causes an overflow error as the parser (cheerio) dies within the PDF. Need to create a parser for different content types to avoid this
* `depth` value is only checked when adding to the queue not when page is fetched. This causes pages that redirect to have a different `depth` value after fetch
* Inline images are not returned with with the `resource` event. Ideally all assets would be returned regardless of whether they are inline or external.

## Maintainers

* [Jay Goodfellow](https://github.com/jaygoodfellow)
* [Arcane Digital Inc](https://github.com/arcanedigital)

## License

Copyright (c) 2017, Arcane & Jay Goodfellow.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
