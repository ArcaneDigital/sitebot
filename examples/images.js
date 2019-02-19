const Crawler = require("sitebot");
const got = require("got");
const crawler = new Crawler({
  url: "http://the-internet.herokuapp.com/broken_images"
});
crawler.parseBackgroundImages = true;

const Images = {};

crawler.on("foundResources", function(queueItem, resources) {
  Images[queueItem.href] = resources.images;
});

crawler.on("end", async function() {
  const imageCodes = {};
  const uniqueImages = [];
  for (let url in Images) {
    for (let image of Images[url]) {
      if (!uniqueImages.includes(image)) {
        uniqueImages.push(image);
        try {
          let head = await got.head(image);
          if (!imageCodes[head.statusCode]) imageCodes[head.statusCode] = [];
          imageCodes[head.statusCode].push({ url, image });
        } catch (e) {
          const status = e.code || e.statusCode || e.response.statusCode;
          if (!imageCodes[status]) imageCodes[status] = [];
          imageCodes[status].push({ url, image });
        }
      }
    }
  }
  console.log(imageCodes);
});
crawler.start();
