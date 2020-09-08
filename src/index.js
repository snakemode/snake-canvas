import { DrawableCanvasElement } from "./DrawableCanvasElement.js";

const canvas = new DrawableCanvasElement("foo").registerPaletteElements("paletteId").registerPaletteElements("asList").onNotification((evt) => console.log(evt));