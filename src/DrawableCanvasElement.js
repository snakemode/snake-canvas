export class DrawableCanvasElement {
    constructor(canvasElementId) {
        this.canvasElementId = canvasElementId;
        this.paintCanvas = document.getElementById(canvasElementId);
        this.paintContext = this.paintCanvas.getContext("2d");

        this.activeColour = "black";
        this.lineWidth = 1;
        this.dragging = false;
        this.cursorPoint = { x: 0, y: 0 };

        this.paintCanvas.onmousedown = (e) => { this.startDrawing(e); };
        this.paintCanvas.onmouseup = (e) => { this.stopDrawing(e); };
        this.paintCanvas.onmouseout = (e) => { this.stopDrawing(e); };
        this.paintCanvas.onmousemove = (e) => { this.makeMarks(e); };

        const canvas = this.paintCanvas;

        document.body.addEventListener("touchstart", (e) => {
            if (e.target == canvas) {
                e.preventDefault();
                this.startDrawing(e);
            }
        }, false);

        document.body.addEventListener("touchend", (e) => {
            if (e.target == canvas) {
                e.preventDefault();
                this.stopDrawing(e);
            }
        }, false);

        document.body.addEventListener("touchmove", (e) => {
            if (e.target == canvas) {
                e.preventDefault();
                this.makeMarks(e);
            }
        }, false);

        this.notificationBuffer = [];
        this.notificationBatch = 1000;
    }

    registerPaletteElements(paletteContainer) {
        const palette = document.getElementById(paletteContainer);
        for (let colour of palette.children) {
            colour.addEventListener('click', (event) => {
                const selectedColour = event.target.style["background-color"] || event.target.dataset.color || event.target.dataset.colour || event.target.id;
                this.setActiveColour(selectedColour);
            });
        }
        return this;
    }

    setActiveColour(colour) {
        this.activeColour = colour;
    }

    clear() {
        this.paintContext.clearRect(0, 0, 100000, 100000);
    }

    getLocationFrom(e) {
        const location = { x: 0, y: 0 };

        if (e.constructor.name === "TouchEvent") {
            const bounds = e.target.getBoundingClientRect();
            const touch = e.targetTouches[0];

            location.x = touch.clientX - bounds.left - 10;
            location.y = touch.clientY - bounds.top - 10;
        } else {
            location.x = e.offsetX;
            location.y = e.offsetY;
        }

        return location;
    }

    startDrawing(e) {
        this.dragging = true;

        const location = this.getLocationFrom(e);
        this.cursorPoint = location;

        this.paintContext.lineWidth = this.lineWidth;
        this.paintContext.lineCap = 'round';
        this.paintContext.filter = 'blur(1px)';

        this.paintContext.beginPath();
        this.paintContext.moveTo(location.x, location.y);
        this.paintContext.strokeStyle = this.activeColour;
    }

    stopDrawing(e) {
        this.dragging = false;
        this.notify(null, true);
        this.paintContext.closePath();
    }

    makeMarks(e) {
        if (!this.dragging) return;

        const location = this.getLocationFrom(e);
        this.paintContext.lineTo(location.x, location.y);
        this.paintContext.stroke();

        this.notify([location.x, location.y]);
    }

    addMarks(events) {
        this.paintContext.lineWidth = this.lineWidth;
        this.paintContext.lineCap = 'round';
        this.paintContext.filter = 'blur(1px)';

        this.paintContext.beginPath();

        let started = false;

        for (let evt of events) {
            if ('setActiveColour' in evt) {
                this.paintContext.strokeStyle = evt.setActiveColour;
                continue;
            }

            if (!started) {
                this.paintContext.moveTo(evt[0], evt[1]);
                started = true;
            }

            this.paintContext.lineTo(evt[0], evt[1]);
            this.paintContext.stroke();
        }

        this.paintContext.closePath();
        this.paintContext.strokeStyle = this.activeColour;
    }

    onNotification(callback) {
        this.notificationCallback = callback;
        return this;
    }

    notify(evt, endPath = false) {
        if (this.notificationCallback == null) {
            return;
        }

        if (evt != null) {
            this.notificationBuffer.push(evt);
        }

        if ((endPath || this.notificationBuffer.length === this.notificationBatch) && this.notificationBuffer.length > 0) {
            // Set colour
            this.notificationBuffer.unshift({ setActiveColour: this.activeColour });

            this.notificationCallback(this.notificationBuffer);

            const lastLoc2 = this.notificationBuffer[this.notificationBuffer.length - 2];
            const lastLoc1 = this.notificationBuffer[this.notificationBuffer.length - 1];

            // Reset buffer
            this.notificationBuffer = [];

            if (!endPath) {
                // Cover up the gaps between paths if the whole path isn't in this one messsage
                this.notificationBuffer.push(lastLoc2);
                this.notificationBuffer.push(lastLoc1);
            }
        }
    }

    setSize(width, height) {

        let temp = this.paintContext.getImageData(0, 0, this.setWidth | 1, this.setHeight | 1);

        this.paintCanvas.width = width;
        this.paintCanvas.height = height;
        this.paintCanvas.style.width = width;
        this.paintCanvas.style.height = height;

        this.setWidth = width;
        this.setHeight = height;

        this.paintContext.putImageData(temp, 0, 0);
    }

    toString() {
        return this.paintCanvas.toDataURL("image/png");
    }
}