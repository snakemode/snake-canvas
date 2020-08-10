import { DrawableCanvasElement } from "./DrawableCanvasElement.js";

const canvas = new DrawableCanvasElement("foo").registerPaletteElements("paletteId").onNotification((evt) => console.log(evt));