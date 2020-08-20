import { createWorker } from "tesseract.js";

const image = `./img/image0.png"`;

const worker = createWorker({
  logger: (m) => console.log(m),
});

(async () => {
  await worker.load();
  await worker.loadLanguage("jpn");
  await worker.initialize("jpn");
  const {
    data: { text },
  } = await worker.recognize(image);

  console.log(text);

  await worker.terminate();
})();
