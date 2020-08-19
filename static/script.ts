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

const getTurningAround = (color: number) => {
  if (color >= 88 && color <= 168) {
    return 255;
  } else {
    return 255 - color;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input") as HTMLInputElement;
  const image = document.getElementById("img_source") as HTMLImageElement;
  const srcCanvas = document.getElementById("src") as HTMLCanvasElement;
  const srcContext = srcCanvas.getContext("2d");
  const selectedCanvas = document.getElementById(
    "selected"
  ) as HTMLCanvasElement;
  const selectedContext = selectedCanvas.getContext("2d");
  if (!srcContext || !selectedContext) return;

  input.addEventListener("change", () => {
    const inputFile = input.files?.[0];
    if (!inputFile) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      image.onload = () => {
        srcCanvas.width = image.width;
        srcCanvas.height = image.height;

        srcContext.drawImage(image, 0, 0);
      };

      image.src = e.target?.result as string;
    };
    reader.readAsDataURL(inputFile);
  });

  const onMouseDown = (e: MouseEvent) => {
    const target = e.target;
    if (!(target instanceof HTMLCanvasElement)) return;

    // 座標の取得
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    selectedArea.mouseDown(x, y);

    // 矩形の枠色反転
    const imageData = srcContext?.getImageData(x, y, 1, 1);
    srcContext.strokeStyle = `rgb(${getTurningAround(
      imageData.data[0]
    )},${getTurningAround(imageData.data[1])},${getTurningAround(
      imageData.data[2]
    )})`;
    // 線の太さを指定
    srcContext.lineWidth = 2;
    // 矩形の枠線を点線にする
    srcContext.setLineDash([2, 3]);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!selectedArea.isMouseDown()) return;

    const target = e.target;
    if (!(target instanceof HTMLCanvasElement)) return;

    // 座標の取得
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    selectedArea.mouseMove(x, y);
    const { startX, startY, endX, endY } = selectedArea.getSelectedArea();

    // 元画像の再描画
    srcContext.drawImage(image, 0, 0);

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

  const onMouseUp = (e: MouseEvent) => {
    if (!selectedArea.isMouseDown) return;

    const { startX, startY, endX, endY } = selectedArea.getSelectedArea();

    // 選択範囲のサイズを取得
    selectedCanvas.width = Math.abs(startX - endX);
    selectedCanvas.height = Math.abs(startY - endY);

    // 指定サイズ以下は無効
    if (
      selectedCanvas.width < MIN_WIDTH &&
      selectedCanvas.height < MIN_HEIGHT
    ) {
      srcContext.drawImage(image, 0, 0);
      selectedArea.init();
      selectedCanvas.width = selectedCanvas.height = 0;
      return;
    }

    // 選択キャンバスへ転送
    selectedContext.drawImage(
      image,
      Math.min(startX, endX),
      Math.min(startY, endY),
      Math.max(startX - endX, endX - startX),
      Math.max(startY - endY, endY - startY),
      0,
      0,
      selectedCanvas.width,
      selectedCanvas.height
    );

    selectedArea.init();
  };

  srcCanvas.onmousedown = onMouseDown;
  srcCanvas.onmousemove = onMouseMove;
  srcCanvas.onmouseup = onMouseUp;

  const btn = document.getElementById("submit") as HTMLButtonElement;
  btn.addEventListener("click", () => {
    const imageData = selectedCanvas.toDataURL();
    // TODO: imageDataをAPIに送信してOCRするんじゃー！    
  });
});
