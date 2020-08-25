// import Tesseract from "tesseract.js";
declare var Tesseract: any;

const MIN_WIDTH = 3;
const MIN_HEIGHT = 3;

class SelectArea {
  private mousedownFlg = false;
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;

  public init() {
    this.mousedownFlg = false;
    this.startX = this.startY = this.endX = this.endY = 0;
  }

  public mouseDown(x: number, y: number) {
    this.mousedownFlg = true;
    this.startX = this.endX = x;
    this.startY = this.endY = y;
  }

  public mouseMove(x: number, y: number) {
    this.endX = x;
    this.endY = y;
  }

  public mouseUp() {
    this.mousedownFlg = false;
  }

  public isMouseDown() {
    return this.mousedownFlg;
  }

  public getSelectedArea() {
    return {
      startX: this.startX,
      startY: this.startY,
      endX: this.endX,
      endY: this.endY,
    };
  }
}

const selectedArea = new SelectArea();

const supportTouch = "ontouchend" in document;

const EVENTNAME_START = supportTouch ? "ontouchstart" : "onmousedown";
const EVENTNAME_MOVE = supportTouch ? "ontouchmove" : "onmousemove";
const EVENTNAME_END = supportTouch ? "ontouchend" : "onmouseup";

const getTurningAround = (color: number) => {
  if (color >= 88 && color <= 168) {
    return 255;
  } else {
    return 255 - color;
  }
};

const convertMap = new Map<string, string>([
  ["①", "1"],
  ["②", "2"],
  ["③", "3"],
  ["④", "4"],
  ["⑤", "5"],
  ["⑥", "6"],
  ["⑦", "7"],
  ["⑧", "8"],
  ["⑨", "9"],
  ["⓪", "0"],
]);

const scale = new (class {
  private scale: number = 1;
  setScale(scale: number) {
    this.scale = scale;
  }
  getScale() {
    return this.scale;
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input") as HTMLInputElement;
  const image = document.getElementById("img_source") as HTMLImageElement;
  const srcCanvas = document.getElementById("src") as HTMLCanvasElement;
  const srcContext = srcCanvas.getContext("2d");
  const selectedCanvas = document.getElementById(
    "selected"
  ) as HTMLCanvasElement;
  const selectedContext = selectedCanvas.getContext("2d");
  const binCanvas = document.getElementById("bin") as HTMLCanvasElement;
  const binContext = binCanvas.getContext("2d");
  const result = document.getElementById("result") as HTMLTextAreaElement;
  const loading = document.getElementById("loading") as HTMLSpanElement;
  if (!srcContext || !selectedContext || !binContext) return;

  const drawSrcImg = () => {
    srcContext.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      0,
      0,
      srcCanvas.width,
      srcCanvas.height
    );
  };

  input.addEventListener("change", () => {
    const inputFile = input.files?.[0];
    if (!inputFile) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      image.onload = () => {
        scale.setScale(screen.width > image.width ? 1 : 0.5);
        console.log(scale.getScale());
        srcCanvas.width = image.width * scale.getScale();
        srcCanvas.height = image.height * scale.getScale();

        drawSrcImg();
      };

      image.src = e.target?.result as string;
    };
    reader.readAsDataURL(inputFile);
  });

  const onPointerDown = (e: MouseEvent | TouchEvent) => {
    const target = e.target;
    if (!(target instanceof HTMLCanvasElement)) return;

    e.preventDefault();

    // 座標の取得
    const rect = target.getBoundingClientRect();
    const x =
      (e instanceof MouseEvent ? e.clientX : e.changedTouches[0].clientX) -
      rect.left;
    const y =
      (e instanceof MouseEvent ? e.clientY : e.changedTouches[0].clientY) -
      rect.top;
    selectedArea.mouseDown(x, y);

    srcContext.strokeStyle = `black`;
    // 線の太さを指定
    srcContext.lineWidth = 2;
    // 矩形の枠線を点線にする
    srcContext.setLineDash([2, 3]);
  };

  const onPointerMove = (e: MouseEvent | TouchEvent) => {
    if (!selectedArea.isMouseDown()) return;

    if (e instanceof TouchEvent && e.changedTouches.length > 1) return;

    e.preventDefault();

    const target = e.target;
    if (!(target instanceof HTMLCanvasElement)) return;

    // 座標の取得
    const rect = target.getBoundingClientRect();
    const x =
      (e instanceof MouseEvent ? e.clientX : e.changedTouches[0].clientX) -
      rect.left;
    const y =
      (e instanceof MouseEvent ? e.clientY : e.changedTouches[0].clientY) -
      rect.top;
    selectedArea.mouseMove(x, y);
    const { startX, startY, endX, endY } = selectedArea.getSelectedArea();

    // 元画像の再描画
    drawSrcImg();

    // 矩形の描画
    srcContext.beginPath();
    // 上
    srcContext.moveTo(startX, startY);
    srcContext.lineTo(endX, startY);
    // 下
    srcContext.moveTo(startX, endY);
    srcContext.lineTo(endX, endY);
    // 右
    srcContext.moveTo(endX, startY);
    srcContext.lineTo(endX, endY);
    // 左
    srcContext.moveTo(startX, startY);
    srcContext.lineTo(startX, endY);

    srcContext.stroke();
  };

  const onPointerUp = (e: Event) => {
    if (!selectedArea.isMouseDown) return;

    e.preventDefault();

    const { startX, startY, endX, endY } = selectedArea.getSelectedArea();
    const scaleValue = scale.getScale();

    // 選択範囲のサイズを取得
    selectedCanvas.width = binCanvas.width =
      Math.abs(startX - endX) / scaleValue;
    selectedCanvas.height = binCanvas.height =
      Math.abs(startY - endY) / scaleValue;

    // 指定サイズ以下は無効
    if (
      selectedCanvas.width < MIN_WIDTH &&
      selectedCanvas.height < MIN_HEIGHT
    ) {
      drawSrcImg();
      selectedArea.init();
      selectedCanvas.width = selectedCanvas.height = 0;
      return;
    }

    // 選択キャンバスへ転送
    selectedContext.drawImage(
      image,
      Math.min(startX, endX) / scaleValue,
      Math.min(startY, endY) / scaleValue,
      Math.max(startX - endX, endX - startX) / scaleValue,
      Math.max(startY - endY, endY - startY) / scaleValue,
      0,
      0,
      selectedCanvas.width,
      selectedCanvas.height
    );

    selectedArea.init();
  };

  srcCanvas[EVENTNAME_START] = onPointerDown;
  srcCanvas[EVENTNAME_MOVE] = onPointerMove;
  srcCanvas[EVENTNAME_END] = onPointerUp;

  const btn = document.getElementById("submit") as HTMLButtonElement;
  btn.addEventListener("click", () => {
    loading.style.display = "inline";
    btn.setAttribute("disabled", "true");

    const imageData = selectedCanvas.toDataURL();

    // 選択範囲の二値化
    const src = selectedContext.getImageData(
      0,
      0,
      selectedCanvas.width,
      selectedCanvas.height
    );
    const dst = selectedContext.createImageData(
      selectedCanvas.width,
      selectedCanvas.height
    );
    for (let i = 0; i < src.data.length; i += 4) {
      const tmp =
        0.2126 * src.data[i] +
        0.7152 * src.data[i + 1] +
        0.0722 * src.data[i + 2];
      const y = Math.floor(tmp) > 200 ? 255 : 0;
      dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = y;
      dst.data[i + 3] = src.data[i + 3];
    }
    binContext.putImageData(dst, 0, 0);

    Tesseract.recognize(imageData, "jpn")
      .then(textConvert)
      .then((text: string) => {
        result.value += `${text}\n`;
      })
      .finally(() => {
        loading.style.display = "none";
        btn.removeAttribute("disabled");
      });
  });
});

const textConvert = ({
  data: { text },
}: {
  data: { text: string };
}): string => {
  const convertedText = [...text]
    // 余分な空白の削除
    .filter((c) => c !== " ")
    // 数字が既知の誤検出を変換
    .map((c) => (convertMap.has(c) ? convertMap.get(c) : c))
    .join("");

  console.log(convertedText);
  const guild =
    convertedText.match(/\[(.{1,8})\](?![とに])/)?.[1] ?? "取得失敗";
  const name = convertedText.match(/(?<=\])(.{1,8})さん/)?.[1] ?? "取得失敗";
  const tb = convertedText.match(/\+(\d{1,2}\.\d{2})%/m)?.[1] ?? "取得失敗";
  // 数値のカンマと誤検出のピリオドを除去
  const tmp = convertedText.replace(/(\d)[.,]+(\d)/g, "$1$2");
  console.log(tmp);
  // 獲得GP
  const acquisition = tmp.match(/^(\d+)GP/m)?.[1] ?? "取得失敗";
  // 争奪GP
  const struggle = tmp.match(/GP(\d+)/m)?.[1] ?? "取得失敗";
  return `${guild},${name},${acquisition},${tb},${struggle}`;
};
