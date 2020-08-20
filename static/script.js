var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var MIN_WIDTH = 3;
var MIN_HEIGHT = 3;
var SelectArea = /** @class */ (function () {
    function SelectArea() {
        this.mousedownFlg = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
    }
    SelectArea.prototype.init = function () {
        this.mousedownFlg = false;
        this.startX = this.startY = this.endX = this.endY = 0;
    };
    SelectArea.prototype.mouseDown = function (x, y) {
        this.mousedownFlg = true;
        this.startX = this.endX = x;
        this.startY = this.endY = y;
    };
    SelectArea.prototype.mouseMove = function (x, y) {
        this.endX = x;
        this.endY = y;
    };
    SelectArea.prototype.mouseUp = function () {
        this.mousedownFlg = false;
    };
    SelectArea.prototype.isMouseDown = function () {
        return this.mousedownFlg;
    };
    SelectArea.prototype.getSelectedArea = function () {
        return {
            startX: this.startX,
            startY: this.startY,
            endX: this.endX,
            endY: this.endY
        };
    };
    return SelectArea;
}());
var selectedArea = new SelectArea();
var supportTouch = "ontouchend" in document;
var EVENTNAME_START = supportTouch ? "ontouchstart" : "onmousedown";
var EVENTNAME_MOVE = supportTouch ? "ontouchmove" : "onmousemove";
var EVENTNAME_END = supportTouch ? "ontouchend" : "onmouseup";
var getTurningAround = function (color) {
    if (color >= 88 && color <= 168) {
        return 255;
    }
    else {
        return 255 - color;
    }
};
var convertMap = new Map([
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
document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("input");
    var image = document.getElementById("img_source");
    var srcCanvas = document.getElementById("src");
    var srcContext = srcCanvas.getContext("2d");
    var selectedCanvas = document.getElementById("selected");
    var selectedContext = selectedCanvas.getContext("2d");
    var binCanvas = document.getElementById("bin");
    var binContext = binCanvas.getContext("2d");
    var result = document.getElementById("result");
    if (!srcContext || !selectedContext || !binContext)
        return;
    input.addEventListener("change", function () {
        var _a;
        var inputFile = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!inputFile)
            return;
        var reader = new FileReader();
        reader.onload = function (e) {
            var _a;
            image.onload = function () {
                srcCanvas.width = image.width;
                srcCanvas.height = image.height;
                srcContext.drawImage(image, 0, 0);
            };
            image.src = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
        };
        reader.readAsDataURL(inputFile);
    });
    var onPointerDown = function (e) {
        var target = e.target;
        if (!(target instanceof HTMLCanvasElement))
            return;
        e.preventDefault();
        // 座標の取得
        var rect = target.getBoundingClientRect();
        var x = (e instanceof MouseEvent ? e.clientX : e.changedTouches[0].clientX) -
            rect.left;
        var y = (e instanceof MouseEvent ? e.clientY : e.changedTouches[0].clientY) -
            rect.top;
        selectedArea.mouseDown(x, y);
        // 矩形の枠色反転
        var imageData = srcContext === null || srcContext === void 0 ? void 0 : srcContext.getImageData(x, y, 1, 1);
        srcContext.strokeStyle = "black";
        // 線の太さを指定
        srcContext.lineWidth = 2;
        // 矩形の枠線を点線にする
        srcContext.setLineDash([2, 3]);
    };
    var onPointerMove = function (e) {
        if (!selectedArea.isMouseDown())
            return;
        if (e instanceof TouchEvent && e.changedTouches.length > 1)
            return;
        e.preventDefault();
        var target = e.target;
        if (!(target instanceof HTMLCanvasElement))
            return;
        // 座標の取得
        var rect = target.getBoundingClientRect();
        var x = (e instanceof MouseEvent ? e.clientX : e.changedTouches[0].clientX) -
            rect.left;
        var y = (e instanceof MouseEvent ? e.clientY : e.changedTouches[0].clientY) -
            rect.top;
        selectedArea.mouseMove(x, y);
        var _a = selectedArea.getSelectedArea(), startX = _a.startX, startY = _a.startY, endX = _a.endX, endY = _a.endY;
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
    var onPointerUp = function (e) {
        if (!selectedArea.isMouseDown)
            return;
        e.preventDefault();
        var _a = selectedArea.getSelectedArea(), startX = _a.startX, startY = _a.startY, endX = _a.endX, endY = _a.endY;
        // 選択範囲のサイズを取得
        selectedCanvas.width = binCanvas.width = Math.abs(startX - endX);
        selectedCanvas.height = binCanvas.height = Math.abs(startY - endY);
        // 指定サイズ以下は無効
        if (selectedCanvas.width < MIN_WIDTH &&
            selectedCanvas.height < MIN_HEIGHT) {
            srcContext.drawImage(image, 0, 0);
            selectedArea.init();
            selectedCanvas.width = selectedCanvas.height = 0;
            return;
        }
        // 選択キャンバスへ転送
        selectedContext.drawImage(image, Math.min(startX, endX), Math.min(startY, endY), Math.max(startX - endX, endX - startX), Math.max(startY - endY, endY - startY), 0, 0, selectedCanvas.width, selectedCanvas.height);
        selectedArea.init();
    };
    srcCanvas[EVENTNAME_START] = onPointerDown;
    srcCanvas[EVENTNAME_MOVE] = onPointerMove;
    srcCanvas[EVENTNAME_END] = onPointerUp;
    var btn = document.getElementById("submit");
    btn.addEventListener("click", function () {
        var imageData = selectedCanvas.toDataURL();
        // 選択範囲の二値化
        var src = selectedContext.getImageData(0, 0, selectedCanvas.width, selectedCanvas.height);
        var dst = selectedContext.createImageData(selectedCanvas.width, selectedCanvas.height);
        for (var i = 0; i < src.data.length; i += 4) {
            var tmp = 0.2126 * src.data[i] +
                0.7152 * src.data[i + 1] +
                0.0722 * src.data[i + 2];
            var y = Math.floor(tmp) > 220 ? 255 : 0;
            dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = y;
            dst.data[i + 3] = src.data[i + 3];
        }
        binContext.putImageData(dst, 0, 0);
        Tesseract.recognize(imageData, "jpn").then(function (_a) {
            var text = _a.data.text;
            var convertedText = new String(__spreadArrays(text).filter(function (c) { return c !== " "; })
                .map(function (c) { return (convertMap.has(c) ? convertMap.get(c) : c); }));
            result.value += convertedText + "\n";
        });
    });
});
