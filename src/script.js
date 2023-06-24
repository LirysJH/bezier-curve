const RADIUS = 8;
const START_ANGLE = 0;
const END_ANGLE = 2;

// canvas related constants
const canvas = document.querySelector('.canvas');
const ctx = canvas.getContext('2d');
const img = new Image();

// setting image source
img.src = './images/img.png';

// mouse related variable
let isMouseDown = false;

// lines related data
let lines = [];
const firstPoint = {
    x: null,
    y: null
};

/**
 * Get mouse position
 *
 * @param {MouseEvent} event
 *
 * @returns {{ x: number, y: number }}
 */
const getMousePos = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

/**
 * Detect mouse position
 * Store relevant data
 *
 * @param {MouseEvent} event
 *
 * @returns {void}
 */
const detectMousePos = (event) => {
    const { x, y } = getMousePos(event);
    storeDotDataAndDrawLine(x, y);
}

/**
 * Put a dot on given coordinates
 *
 * @param {number} x
 * @param {number} y
 * @param {string} color
 *
 * @returns {void}
 */
const putDot = (x, y, color) => {
    ctx.beginPath();
    ctx.arc(x, y, RADIUS, START_ANGLE, END_ANGLE * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.closePath();
};

/**
 * Store dot data
 * Draw elements when required
 *
 * @param {number} x
 * @param {number} y
 *
 * @returns {void}
 */
const storeDotDataAndDrawLine = (x, y) => {
    const values = Object.values(firstPoint);
    const isAnyValueNull = values.some(val => val === null);

    if (lines.length === 1) { // limitation to work with one line
        return;
    }

    // if there's no first dot position data
    if (isAnyValueNull) {
        firstPoint.x = x;
        firstPoint.y = y;
        putDot(x, y, 'green');

        return;
    }

    // if there's first dot position data
    if (!isAnyValueNull) {
        const { midX, midY } = getLineMidPoint(firstPoint.x, firstPoint.y, x, y);
        const start = {
            x: firstPoint.x,
            y: firstPoint.y,
        };
        const mid = {
            x: midX,
            y: midY
        };
        const end = {
            x,
            y
        };

        const isSimpleDot = start.x === end.x && start.y === end.y;

        if (isSimpleDot) {
            cleanFirstPointData();

            return;
        }

        // to draw all the dots above the curve
        ctx.clearRect(0, 0, canvas.height, canvas.width);
        drawBgImage();
        drawBezierCurve(firstPoint.x, firstPoint.y, x, y, x, y);
        putDot(firstPoint.x, firstPoint.y, 'green');
        putDot(midX, midY, 'green');
        putDot(x, y, 'green');

        // store unique points data
        lines.push({ start, mid, end });
        lines = Array.from(new Set(lines));

        cleanFirstPointData();
    }
};

/**
 * Draw bezier curve
 *
 * @param {number} p1x
 * @param {number} p1y
 * @param {number} p2x
 * @param {number} p2y
 * @param {number} endX
 * @param {number} endY
 *
 * @returns {void}
 */
const drawBezierCurve = (p1x, p1y, p2x, p2y, endX, endY) => {
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.bezierCurveTo(p1x, p1y, p2x, p2y, endX, endY);
    ctx.strokeStyle="#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
};

/**
 * Draw canvas background image
 *
 * @returns {void}
 */
const drawBgImage = () => {
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.min(hRatio, vRatio);

    ctx.drawImage(
        img, 0, 0,
        img.width, img.height,
        0, 0,
        img.width * ratio, img.height * ratio
    );
}

img.onload = () => drawBgImage();

canvas.onmousedown = (event) => {
    isMouseDown = true;
    detectMousePos(event);
}

canvas.onmouseup = (event) => {
    isMouseDown = false;
    detectMousePos(event);
}

canvas.onmousemove = (event) => {
    if (!isMouseDown) {
        return;
    }

    dragCurveControlPoint(event);
}

/**
 * Drag curve control point
 *
 * @param {MouseEvent} event
 *
 * @returns {void}
 */
const dragCurveControlPoint = (event) => {
    const { x, y } = getMousePos(event);

    if (lines.length) {
        const dotEntries = Object.entries(lines[0]);

        dotEntries.forEach((entry) => {
            const dx = x - entry[1].x;
            const dy = y - entry[1].y;
            const line = dx * dx + dy * dy;

            if (line < RADIUS * RADIUS) {
                drawLineLive(x, y, entry[0]); // entry[0] is used to let function know what dot is dragged
            }
        });
    } else {
        drawLineLive(x, y, 'end');
    }
};

/**
 * Get middle control point located on the curve
 * Draw it afterward
 *
 * @param {{x: number, y: number}} start
 * @param {{x: number, y: number}} mid
 * @param {{x: number, y: number}} end
 *
 * @returns {void}
 */
const drawMidControlPointOnCurve = (start, mid, end) => {
    const st_to_mid = getLineMidPoint(start.x, start.y, mid.x, mid.y);
    const mid_to_end = getLineMidPoint(mid.x, mid.y, end.x, end.y);

    // middle control point on the curve
    // bigger distortion requires more complicated calculations
    const res = getLineMidPoint(st_to_mid.midX, st_to_mid.midY, mid_to_end.midX, mid_to_end.midY);

    putDot(res.midX, res.midY, 'gold');
};

/**
 * Draw line segment elements
 *
 * @param {number} x
 * @param {number} y
 * @param {string} key
 *
 * @returns {void}
 */
const drawLineLive = (x, y, key) => {
    ctx.clearRect(0, 0, canvas.height, canvas.width);
    drawBgImage();

    if (!lines.length) { // draw line segment on the first entry
        drawBezierCurve(firstPoint.x, firstPoint.y, x, y, x, y);
        putDot(firstPoint.x, firstPoint.y, 'green');

        return;
    }

    const { start, mid, end } = lines[0];

    switch (key) {
        case 'start':
            drawBezierCurve(x, y, mid.x, mid.y, end.x, end.y);

            putDot(x, y, 'green');
            putDot(mid.x, mid.y, 'green');
            putDot(end.x, end.y, 'green');

            start.x = x;
            start.y = y;

            drawMidControlPointOnCurve({ x, y }, mid, end);

            break;
        case 'mid':
            drawBezierCurve(start.x, start.y, x, y, end.x, end.y);

            putDot(start.x, start.y, 'green');
            putDot(x, y, 'green');
            putDot(end.x, end.y, 'green');

            mid.x = x;
            mid.y = y;

            drawMidControlPointOnCurve(start, { x, y }, end);

            break;
        case 'end':
            drawBezierCurve(start.x, start.y, mid.x, mid.y, x, y);

            putDot(start.x, start.y, 'green');
            putDot(mid.x, mid.y, 'green');
            putDot(x, y, 'green');

            end.x = x;
            end.y = y;

            drawMidControlPointOnCurve(start, mid, { x, y });

            break;
        default:
            break;
    }
};

/**
 * Detect middle point of line segment
 *
 * @param {number} startX
 * @param {number} startY
 * @param {number} endX
 * @param {number} endY
 *
 * @returns {{ midX: number, midY: number }}
 */
const getLineMidPoint = (startX, startY, endX, endY) => {
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return { midX, midY };
};

/**
 * Clean first point data
 *
 * @returns {void}
 */
const cleanFirstPointData = () => {
    firstPoint.x = null;
    firstPoint.y = null;
};

/**
 * React to a button click
 * Clear the line from the canvas
 *
 * @returns {void}
 */
const onBtnClick = () => {
    lines = [];
    ctx.clearRect(0, 0, canvas.height, canvas.width);
    drawBgImage();
};
