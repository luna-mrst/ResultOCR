"use strict";
const MIN_WIDTH = 3;
const MIN_HEIGHT = 3;
class SelectArea {
    constructor() {
        this.mousedownFlg = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
    }
    init() {
        this.mousedownFlg = false;
        this.startX = this.startY = this.endX = this.endY = 0;
    }
    mouseDown(x, y) {
        this.mousedownFlg = true;
        this.startX = this.endX = x;
        this.startY = this.endY = y;
    }
    mouseMove(x, y) {
        this.endX = x;
        this.endY = y;
    }
    mouseUp() {
        this.mousedownFlg = false;
    }
    isMouseDown() {
        return this.mousedownFlg;
    }
    getSelectedArea() {
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
const getTurningAround = (color) => {
    if (color >= 88 && color <= 168) {
        return 255;
    }
    else {
        return 255 - color;
    }
};
const convertMap = new Map([
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
    constructor() {
        this.scale = 1;
    }
    setScale(scale) {
        this.scale = scale;
    }
    getScale() {
        return this.scale;
    }
})();
document.addEventListener("DOMContentLoaded", () => {
    var _a;
    const input = document.getElementById("input");
    const image = document.getElementById("img_source");
    const srcCanvas = document.getElementById("src");
    const srcContext = srcCanvas.getContext("2d");
    const selectedCanvas = document.getElementById("selected");
    const selectedContext = selectedCanvas.getContext("2d");
    const binCanvas = document.getElementById("bin");
    const binContext = binCanvas.getContext("2d");
    const result = document.getElementById("result");
    const loading = document.getElementById("loading");
    const guildInput = document.getElementById("guild");
    const nameInput = document.getElementById("name");
    const tbInput = document.getElementById("tb");
    const acquisitionInput = document.getElementById("acquisition");
    const struggleInput = document.getElementById("struggle");
    if (!srcContext || !selectedContext || !binContext)
        return;
    const drawSrcImg = () => {
        srcContext.drawImage(image, 0, 0, image.width, image.height, 0, 0, srcCanvas.width, srcCanvas.height);
    };
    input.addEventListener("change", () => {
        var _a;
        const inputFile = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!inputFile)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            image.onload = () => {
                scale.setScale(screen.width > image.width ? 1 : 0.5);
                console.log(scale.getScale());
                srcCanvas.width = image.width * scale.getScale();
                srcCanvas.height = image.height * scale.getScale();
                drawSrcImg();
            };
            image.src = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
        };
        reader.readAsDataURL(inputFile);
    });
    const onPointerDown = (e) => {
        const target = e.target;
        if (!(target instanceof HTMLCanvasElement))
            return;
        e.preventDefault();
        // 座標の取得
        const rect = target.getBoundingClientRect();
        const x = (e instanceof MouseEvent ? e.clientX : e.changedTouches[0].clientX) -
            rect.left;
        const y = (e instanceof MouseEvent ? e.clientY : e.changedTouches[0].clientY) -
            rect.top;
        selectedArea.mouseDown(x, y);
        srcContext.strokeStyle = `black`;
        // 線の太さを指定
        srcContext.lineWidth = 2;
        // 矩形の枠線を点線にする
        srcContext.setLineDash([2, 3]);
    };
    const onPointerMove = (e) => {
        if (!selectedArea.isMouseDown())
            return;
        if (e instanceof TouchEvent && e.changedTouches.length > 1)
            return;
        e.preventDefault();
        const target = e.target;
        if (!(target instanceof HTMLCanvasElement))
            return;
        // 座標の取得
        const rect = target.getBoundingClientRect();
        const x = (e instanceof MouseEvent ? e.clientX : e.changedTouches[0].clientX) -
            rect.left;
        const y = (e instanceof MouseEvent ? e.clientY : e.changedTouches[0].clientY) -
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
    const onPointerUp = (e) => {
        if (!selectedArea.isMouseDown)
            return;
        e.preventDefault();
        const { startX, startY, endX, endY } = selectedArea.getSelectedArea();
        const scaleValue = scale.getScale();
        // 選択範囲のサイズを取得
        selectedCanvas.width = binCanvas.width =
            Math.abs(startX - endX) / scaleValue;
        selectedCanvas.height = binCanvas.height =
            Math.abs(startY - endY) / scaleValue;
        // 指定サイズ以下は無効
        if (selectedCanvas.width < MIN_WIDTH &&
            selectedCanvas.height < MIN_HEIGHT) {
            drawSrcImg();
            selectedArea.init();
            selectedCanvas.width = selectedCanvas.height = 0;
            return;
        }
        // 選択キャンバスへ転送
        selectedContext.drawImage(image, Math.min(startX, endX) / scaleValue, Math.min(startY, endY) / scaleValue, Math.max(startX - endX, endX - startX) / scaleValue, Math.max(startY - endY, endY - startY) / scaleValue, 0, 0, selectedCanvas.width, selectedCanvas.height);
        selectedArea.init();
    };
    srcCanvas[EVENTNAME_START] = onPointerDown;
    srcCanvas[EVENTNAME_MOVE] = onPointerMove;
    srcCanvas[EVENTNAME_END] = onPointerUp;
    const btn = document.getElementById("submit");
    btn.addEventListener("click", () => {
        loading.style.display = "inline";
        btn.setAttribute("disabled", "true");
        const imageData = selectedCanvas.toDataURL();
        // 選択範囲の二値化
        const src = selectedContext.getImageData(0, 0, selectedCanvas.width, selectedCanvas.height);
        const dst = selectedContext.createImageData(selectedCanvas.width, selectedCanvas.height);
        for (let i = 0; i < src.data.length; i += 4) {
            const tmp = 0.2126 * src.data[i] +
                0.7152 * src.data[i + 1] +
                0.0722 * src.data[i + 2];
            const y = Math.floor(tmp) > 200 ? 255 : 0;
            dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = y;
            dst.data[i + 3] = src.data[i + 3];
        }
        binContext.putImageData(dst, 0, 0);
        Tesseract.recognize(imageData, "jpn")
            .then(textConvert)
            .then(({ guild, name, tb, acquisition, struggle }) => {
            document.getElementById("loaded").style.display = "block";
            guildInput.value = guild;
            nameInput.value = name;
            tbInput.value = tb;
            acquisitionInput.value = acquisition.replace(/(\d)(?=(\d{3})+$)/g, "$1,");
            struggleInput.value = struggle.replace(/(\d)(?=(\d{3})+$)/g, "$1,");
        })
            .finally(() => {
            loading.style.display = "none";
            btn.removeAttribute("disabled");
        });
    });
    (_a = document.getElementById("ok")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
        result.value += `${guildInput.value},${nameInput.value},${acquisitionInput.value.replace(/,/g, "")},${tbInput.value},${struggleInput.value.replace(/,/g, "")}\n`;
        document.getElementById("loaded").style.display =
            "none";
    });
});
const textConvert = ({ data: { text } }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const convertedText = [...text]
        // 余分な空白の削除
        .filter((c) => c !== " ")
        // 数字が既知の誤検出を変換
        .map((c) => (convertMap.has(c) ? convertMap.get(c) : c))
        .join("");
    console.log(convertedText);
    const guild = (_b = (_a = convertedText.match(/\[(.{1,8})\](?![とに])/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : "取得失敗";
    const name = (_d = (_c = convertedText.match(/(?<=\])(.{1,8})さん/)) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : "取得失敗";
    const tb = (_f = (_e = convertedText.match(/\+(\d{1,2}\.\d{2})%/m)) === null || _e === void 0 ? void 0 : _e[1]) !== null && _f !== void 0 ? _f : "取得失敗";
    // 数値のカンマと誤検出のピリオドを除去
    const tmp = convertedText.replace(/(\d)[.,]+(\d)/g, "$1$2");
    console.log(tmp);
    // 獲得GP
    const acquisition = (_h = (_g = tmp.match(/^(\d+)GP/m)) === null || _g === void 0 ? void 0 : _g[1]) !== null && _h !== void 0 ? _h : "取得失敗";
    // 争奪GP
    const struggle = (_k = (_j = tmp.match(/GP(\d+)/m)) === null || _j === void 0 ? void 0 : _j[1]) !== null && _k !== void 0 ? _k : "取得失敗";
    // return `${guild},${name},${acquisition},${tb},${struggle}`;
    return { guild, name, tb, acquisition, struggle };
};
