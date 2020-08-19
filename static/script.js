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
var getTurningAround = function (color) {
    if (color >= 88 && color <= 168) {
        return 255;
    }
    else {
        return 255 - color;
    }
};
document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("input");
    var image = document.getElementById("img_source");
    var srcCanvas = document.getElementById("src");
    var srcContext = srcCanvas.getContext("2d");
    var selectedCanvas = document.getElementById("selected");
    var selectedContext = selectedCanvas.getContext("2d");
    if (!srcContext || !selectedContext)
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
    var onMouseDown = function (e) {
        var target = e.target;
        if (!(target instanceof HTMLCanvasElement))
            return;
        // 座標の取得
        var rect = target.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        selectedArea.mouseDown(x, y);
        // 矩形の枠色反転
        var imageData = srcContext === null || srcContext === void 0 ? void 0 : srcContext.getImageData(x, y, 1, 1);
        srcContext.strokeStyle = "rgb(" + getTurningAround(imageData.data[0]) + "," + getTurningAround(imageData.data[1]) + "," + getTurningAround(imageData.data[2]) + ")";
        // 線の太さを指定
        srcContext.lineWidth = 2;
        // 矩形の枠線を点線にする
        srcContext.setLineDash([2, 3]);
    };
    var onMouseMove = function (e) {
        if (!selectedArea.isMouseDown())
            return;
        var target = e.target;
        if (!(target instanceof HTMLCanvasElement))
            return;
        // 座標の取得
        var rect = target.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
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
    var onMouseUp = function (e) {
        var _a = selectedArea.getSelectedArea(), startX = _a.startX, startY = _a.startY, endX = _a.endX, endY = _a.endY;
        // キャンバスの範囲外は無効
        if (startX === endX && startY === endY) {
            alert("hoge");
            srcContext.drawImage(image, 0, 0);
            selectedArea.init();
            selectedCanvas.width = selectedCanvas.height = 0;
        }
        if (!selectedArea.isMouseDown)
            return;
        // 選択範囲のサイズを取得
        selectedCanvas.width = Math.abs(startX - endX);
        selectedCanvas.height = Math.abs(startY - endY);
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
    srcCanvas.onmousedown = onMouseDown;
    srcCanvas.onmousemove = onMouseMove;
    srcCanvas.onmouseup = onMouseUp;
    var btn = document.getElementById("submit");
    btn.addEventListener("click", function () {
        var image = document.createElement("img");
        image.src = selectedCanvas.toDataURL();
        document.body.appendChild(image);
    });
});
