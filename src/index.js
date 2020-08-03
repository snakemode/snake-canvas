import { DrawableCanvasElement } from "./DrawableCanvasElement.js";

const canvas = new DrawableCanvasElement("foo").onNotification((evt) => console.log(evt));