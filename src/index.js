import { DrawableCanvasElement } from "./DrawableCanvasElement.js";

const canvas = new DrawableCanvasElement("foo");
const canvas2 = new DrawableCanvasElement("secondCanvas");

canvas.registerPaletteElements("paletteId");
canvas.onNotification((msg) => {
    console.log(msg);

    const asStr = JSON.stringify(msg);
    console.log("LENGTH OF MESSAGE", asStr.length);

    canvas2.addMarks(msg);
});

canvas.setSize(1024, 768);
canvas2.setSize(1024, 768);