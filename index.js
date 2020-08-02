const ytlist = require("youtube-playlist");
const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");

const printProgress = (message) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(message);
};

const download = (url, folder, title, options) => {
  if (!fs.existsSync(`download`))
    fs.mkdirSync(`download`, (err) => {
      if (err) {
        console.log("Couldn't create folder download");
        return;
      }
      console.log("Successfully created folder download");
    });
  if (!fs.existsSync(`download/${folder}`))
    fs.mkdirSync(`download/${folder}`, (err) => {
      if (err) {
        console.log(`Couldn't create folder download/${folder}`);
        return;
      }
      console.log(`Successfully created folder download/${folder}`);
    });

  const writer = fs.createWriteStream(
    path.resolve(__dirname, "download", folder, `${title}.mp4`)
  );
  let contentLength = 0;
  ytdl(url, options)
    .on("info", (videoInfo, videoFormat) => {
      contentLength = Number(videoFormat.contentLength);
    })
    .on("progress", (byteReceived, totalByteReceived, totalByteFile) => {
      if (contentLength)
        printProgress(
          `Completed ${((totalByteReceived / totalByteFile) * 100).toFixed(
            2
          )} %`
        );
    })
    .pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

module.exports = (url, options) => {
  ytlist(url, ["url", "name"]).then(async (res) => {
    const { name: foldername, playlist } = res.data;
    for (let i = 0; i < playlist.length; i++) {
      const { url, name: title } = playlist[i];
      console.log(`Started ${title}`);
      try {
        await download(url, foldername.replace(/\|/g, "-"), title);
      } catch (err) {
        i--;
      }
      console.log(`\nCompleted ${title}`);
    }
  });
};
