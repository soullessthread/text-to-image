"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSync = exports.generate = void 0;
const fs_1 = __importDefault(require("fs"));
const sharp = require('sharp');
const canvas_1 = __importDefault(require("canvas"));
const defaults = {
    bgColor: '#fff',
    customHeight: 0,
    debug: false,
    debugFilename: '',
    fontFamily: 'Helvetica',
    fontPath: '',
    fontSize: 18,
    fontWeight: 'normal',
    lineHeight: 28,
    margin: 10,
    maxWidth: 400,
    textAlign: 'left',
    textColor: '#000',
    verticalAlign: 'top',
};
const createTextData = (text, config, canvas) => {
    const { bgColor, fontFamily, fontPath, fontSize, fontWeight, lineHeight, maxWidth, textAlign, textColor, } = config;
    if (fontPath) {
        canvas_1.default.registerFont(fontPath, { family: fontFamily });
    }
    const textCanvas = canvas || canvas_1.default.createCanvas(maxWidth, 100);
    const textContext = textCanvas.getContext('2d');
    let textX = 0;
    let textY = 0;
    if (['center'].includes(textAlign.toLowerCase())) {
        textX = maxWidth / 2;
    }
    if (['right', 'end'].includes(textAlign.toLowerCase())) {
        textX = maxWidth - (fontSize / 3);
    }
    textContext.textAlign = textAlign;
    textContext.fillStyle = bgColor;
    textContext.fillRect(0, 0, textCanvas.width, textCanvas.height);
    textContext.fillStyle = textColor;
    textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    textContext.textBaseline = 'top';
    const words = text.split(' ');
    let wordCount = words.length;
    let line = '';
    const addNewLines = [];
    for (let n = 0; n < wordCount; n += 1) {
        let word = words[n];
        if (/\n/.test(words[n])) {
            const parts = words[n].split('\n');
            word = parts.shift() || '';
            addNewLines.push(n + 1);
            words.splice(n + 1, 0, parts.join('\n'));
            wordCount += 1;
        }
        const testLine = `${line} ${word}`.replace(/^ +/, '').replace(/ +$/, '');
        const testLineWidth = textContext.measureText(testLine).width + (fontSize / 3);
        if (addNewLines.indexOf(n) > -1 || (testLineWidth > maxWidth && n > 0)) {
            textContext.fillText(line, textX, textY);
            line = word;
            textY += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    textContext.fillText(line, textX, textY);
    const height = textY + Math.max(lineHeight, fontSize);
    return {
        textHeight: height,
        textData: textContext.getImageData(0, 0, maxWidth, height),
    };
};
const createCanvas = (content, conf) => {
    const { textHeight } = createTextData(content, {
        maxWidth: conf.maxWidth - conf.margin * 2,
        fontSize: conf.fontSize,
        lineHeight: conf.lineHeight,
        bgColor: conf.bgColor,
        textColor: conf.textColor,
        fontFamily: conf.fontFamily,
        fontPath: conf.fontPath,
        fontWeight: conf.fontWeight,
        textAlign: conf.textAlign,
    });
    const textHeightWithMargins = textHeight + conf.margin * 2;
    if (conf.customHeight && conf.customHeight < textHeightWithMargins) {
        console.warn('Text is longer than customHeight, clipping will occur.');
    }
    const canvas = canvas_1.default.createCanvas(conf.maxWidth, conf.customHeight || textHeightWithMargins);
    const { textData } = createTextData(content, {
        maxWidth: conf.maxWidth - conf.margin * 2,
        fontSize: conf.fontSize,
        lineHeight: conf.lineHeight,
        bgColor: conf.bgColor,
        textColor: conf.textColor,
        fontFamily: conf.fontFamily,
        fontPath: conf.fontPath,
        fontWeight: conf.fontWeight,
        textAlign: conf.textAlign,
    }, canvas);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = conf.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const textX = conf.margin;
    let textY = conf.margin;
    if (conf.customHeight && conf.verticalAlign === 'center') {
        textY =
            (conf.customHeight - textData.height) / 2 +
                Math.max(0, (conf.lineHeight - conf.fontSize) / 2);
    }
    ctx.putImageData(textData, textX, textY);
    return canvas;
};
const generate = async (content, config) => {
    const conf = { ...defaults, ...config };
    const canvas = createCanvas(content, conf);
    // const dataUrl = canvas.toDataURL();
    if (conf.debug) {
        const fileName = conf.debugFilename ||
            `${new Date().toISOString().replace(/[\W.]/g, '')}.png`;
        await fs_1.default.promises.writeFile(fileName, canvas.toBuffer());
    }

    return sharp(canvas.toBuffer()).toFormat(sharp.format.webp);
    // return dataUrl;
};
exports.generate = generate;
const generateSync = (content, config) => {
    const conf = { ...defaults, ...config };
    const canvas = createCanvas(content, conf);
    const dataUrl = canvas.toDataURL();
    if (conf.debug) {
        const fileName = conf.debugFilename ||
            `${new Date().toISOString().replace(/[\W.]/g, '')}.png`;
        fs_1.default.writeFileSync(fileName, canvas.toBuffer());
    }
    return dataUrl;
};
exports.generateSync = generateSync;
//# sourceMappingURL=textToImage.js.map