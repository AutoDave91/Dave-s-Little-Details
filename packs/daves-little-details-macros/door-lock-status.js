// === Door Check Macro with Right-Click + Token Proximity + Timeout ===

// Avoid multiple listeners
if (canvas._doorCheckListener) {
    ui.notifications.warn("Already waiting for a right-click. Try again after clicking or timeout.");
    return;
}

// Get selected token
const token = canvas.tokens.controlled[0];
if (!token) {
    ui.notifications.warn("Please select a token first.");
    return;
}

ui.notifications.info("Right-click near a door within 1 square of your selected token (15s timeout).");

// === Distance Helpers ===
function distanceToSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1;
    const C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx, dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function highlightDoor(door) {
    const highlight = canvas.effects.highlightDoors || canvas.highlightLayers?.doors;
    if (!highlight) return;
    highlight.highlight([door], {
        color: 0xffff00,
        alpha: 0.8,
        duration: 1500
    });
}

// === Cleanup Handler ===
function cleanupListener() {
    if (canvas._doorCheckListener) {
        canvas.stage.off("rightdown", handleRightClick);
        delete canvas._doorCheckListener;
        if (canvas._doorCheckTimeout) {
            clearTimeout(canvas._doorCheckTimeout);
            delete canvas._doorCheckTimeout;
        }
    }
}

// === Right-click Handler ===
function handleRightClick(event) {
    cleanupListener();

    const clickPos = event.data.getLocalPosition(canvas.stage);
    const clickX = clickPos.x;
    const clickY = clickPos.y;

    // Proximity to token
    const tokenCenter = token.center;
    const dx = tokenCenter.x - clickX;
    const dy = tokenCenter.y - clickY;
    const distance = Math.hypot(dx, dy);
    const gridSize = canvas.grid.size;
    if (distance > gridSize) {
        ui.notifications.warn("You must click within 1 square of your selected token.");
        return;
    }

    // Filter valid doors
    const doors = canvas.walls.placeables.filter(w => {
        const d = w.document;
        return d.door > 0 && d.door !== 2; // Not secret
    });

    // Find closest door to click
    let closest = null;
    let minDist = Infinity;
    for (const wall of doors) {
        const [x1, y1, x2, y2] = wall.document.c;
        const dist = distanceToSegment(clickX, clickY, x1, y1, x2, y2);
        if (dist < minDist) {
            minDist = dist;
            closest = wall;
        }
    }

    if (!closest || minDist > gridSize) {
        ui.notifications.warn("No door found near where you clicked.");
        return;
    }

    highlightDoor(closest);
    const isLocked = closest.document.ds === 2;
    const status = isLocked ? "LOCKED" : "UNLOCKED";

    ChatMessage.create({
        content: `🗝️ <strong>Door Status:</strong> ${status}`
    });
}

// === Setup Listener and Timeout ===
canvas._doorCheckListener = true;
canvas.stage.once("rightdown", handleRightClick);

// Cancel after 15 seconds
canvas._doorCheckTimeout = setTimeout(() => {
    cleanupListener();
    ui.notifications.warn("Door check canceled: no click received within 15 seconds.");
}, 15000);