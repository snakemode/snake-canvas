import { DrawableCanvasElement } from "./DrawableCanvasElement.js";

const canvas = new DrawableCanvasElement("foo").registerPaletteElements("paletteId").registerPaletteElements("asList").onNotification((msg) => {
    for (let evt of msg) {
        if ('setActiveColour' in evt) {
            console.log("setActiveColour", evt.setActiveColour);
        }

        if ('x' in evt && 'y' in evt) {
            console.log("Draw", evt);
        }
    }
});