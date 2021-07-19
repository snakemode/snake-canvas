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
                const thickness = parseInt(event.target.dataset.thickness) || 1;

                [...palette.children].forEach(c => c.setAttribute('data-active', 'false'));

                colour.setAttribute('data-active', 'true');
                this.setActiveColour(selectedColour, thickness);
                palette.setAttribute('data-selected', selectedColour);
            });
        }
        return this;
    }

    setActiveColour(colour, thickness) {
        this.activeColour = colour;
        this.lineWidth = thickness || 1;
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
    }

    makeMarks(e) {
        if (!this.dragging) return;

        const location = this.getLocationFrom(e);

        if (this.activeColour == "transparent") {
            this.paintContext.clearRect(location.x, location.y, this.lineWidth, this.lineWidth);
        } else {
            this.paintContext.lineTo(location.x, location.y);
            this.paintContext.stroke();
        }

        this.notify([location.x, location.y, this.lineWidth]);
    }

    addMarks(events) {

        var tempCanvas = document.createElement("CANVAS");
        tempCanvas.width = this.paintCanvas.width;
        tempCanvas.height = this.paintCanvas.height;

        var paintContext = tempCanvas.getContext("2d");

        paintContext.lineWidth = this.lineWidth;
        paintContext.lineCap = 'round';
        paintContext.filter = 'blur(1px)';

        paintContext.beginPath();

        let started = false;
        let transparent = false;

        for (let evt of events) {
            if ('setActiveColour' in evt) {
                paintContext.strokeStyle = evt.setActiveColour;
                transparent = evt.setActiveColour === "transparent" ? true : false;
                continue;
            }

            if (!started) {
                // Always moveTo first x,y coord to line paths up.
                paintContext.lineWidth = evt[2];
                paintContext.moveTo(evt[0], evt[1]);
                started = true;
            }

            if (transparent) {
                this.paintContext.clearRect(evt[0], evt[1], evt[2], evt[2]);
            } else {
                paintContext.lineTo(evt[0], evt[1]);
                paintContext.stroke();
            }
        }

        this.paintContext.drawImage(tempCanvas, 0, 0);

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

            // Capture last couple of points to cover up path differences
            const buffLen = this.notificationBuffer.length;
            const coverUpLocations = [this.notificationBuffer[buffLen - 2], this.notificationBuffer[buffLen - 1]].filter(x => x);

            // Reset buffer
            this.notificationBuffer = [];

            if (!endPath) {
                this.notificationBuffer.push(...coverUpLocations);
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