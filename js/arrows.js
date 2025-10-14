let arrows = [];
let arrowIdCounter = 0;
let connectMode = false;
let sourceShape = null;

const arrowsLayer = document.getElementById('arrows-layer');
function createArrow(fromShapeId, toShapeId, label = '') {
    const arrowId = `arrow-${arrowIdCounter++}`;
    
    const arrowData = {
        id: arrowId,
        from: fromShapeId,
        to: toShapeId,
        label: label
    };
    
    arrows.push(arrowData);
    renderArrow(arrowData);
    
    console.log(`➡️ Flecha creada: ${fromShapeId} -> ${toShapeId}`);
    updateStats();
}
function renderArrow(data) {
    const fromShape = getShapeById(data.from);
    const toShape = getShapeById(data.to);
    
    if (!fromShape || !toShape) {
        console.error('❌ Figuras no encontradas para la flecha');
        return;
    }
    const fromPos = { x: fromShape.x, y: fromShape.y };
    const toPos = { x: toShape.x, y: toShape.y };
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'arrow-group');
    g.setAttribute('data-id', data.id);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'arrow');
    line.setAttribute('x1', fromPos.x);
    line.setAttribute('y1', fromPos.y);
    line.setAttribute('x2', toPos.x);
    line.setAttribute('y2', toPos.y);
    
    g.appendChild(line);
    if (data.label) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'arrow-label');
        text.setAttribute('x', (fromPos.x + toPos.x) / 2);
        text.setAttribute('y', (fromPos.y + toPos.y) / 2 - 10);
        text.textContent = data.label;
        g.appendChild(text);
    }
    
    arrowsLayer.appendChild(g);
    line.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (confirm('¿Eliminar esta conexión?')) {
            deleteArrow(data.id);
        }
    });
}
function updateAllArrows() {
    arrows.forEach(arrowData => {
        const arrowGroup = document.querySelector(`[data-id="${arrowData.id}"]`);
        if (!arrowGroup) return;
        
        const fromShape = getShapeById(arrowData.from);
        const toShape = getShapeById(arrowData.to);
        
        if (!fromShape || !toShape) return;
        
        const line = arrowGroup.querySelector('.arrow');
        const label = arrowGroup.querySelector('.arrow-label');
        line.setAttribute('x1', fromShape.x);
        line.setAttribute('y1', fromShape.y);
        line.setAttribute('x2', toShape.x);
        line.setAttribute('y2', toShape.y);
        if (label) {
            label.setAttribute('x', (fromShape.x + toShape.x) / 2);
            label.setAttribute('y', (fromShape.y + toShape.y) / 2 - 10);
        }
    });
}
function deleteArrow(arrowId) {
    arrows = arrows.filter(a => a.id !== arrowId);
    
    const arrowGroup = document.querySelector(`[data-id="${arrowId}"]`);
    if (arrowGroup) {
        arrowGroup.remove();
    }
    
    console.log(`🗑️ Flecha eliminada: ${arrowId}`);
    updateStats();
}
function deleteArrowsForShape(shapeId) {
    const arrowsToDelete = arrows.filter(a => 
        a.from === shapeId || a.to === shapeId
    );
    
    arrowsToDelete.forEach(arrow => {
        deleteArrow(arrow.id);
    });
}
function toggleConnectMode() {
    connectMode = !connectMode;
    const btn = document.getElementById('connectModeBtn');
    const canvas = document.getElementById('canvas');
    
    if (connectMode) {
        btn.classList.add('active');
        canvas.classList.add('connect-mode');
        sourceShape = null;
        console.log('🔗 Modo conexión ACTIVADO');
    } else {
        btn.classList.remove('active');
        canvas.classList.remove('connect-mode');
        sourceShape = null;
        
        document.querySelectorAll('.shape').forEach(s => {
            s.classList.remove('connect-source');
        });
        
        console.log('🔗 Modo conexión DESACTIVADO');
    }
}
function handleConnectClick(shapeId, shapeElement) {
    if (!connectMode) return;
    
    if (!sourceShape) {
        sourceShape = shapeId;
        shapeElement.classList.add('connect-source');
        console.log(`📍 Figura origen seleccionada: ${shapeId}`);
    } else {
        if (sourceShape === shapeId) {
            showAlert('No puedes conectar una figura consigo misma', 'error');
            return;
        }
        const exists = arrows.some(a => 
            a.from === sourceShape && a.to === shapeId
        );
        
        if (exists) {
            showAlert('Esta conexión ya existe', 'error');
        } else {
            const fromShapeData = getShapeById(sourceShape);
            let label = '';
            
            if (fromShapeData && fromShapeData.type === 'decision') {
    label = prompt('¿Esta flecha es Sí o No?', 'Sí');
    if (label === null) label = ''; 
}
            createArrow(sourceShape, shapeId, label || '');
            showAlert('Conexión creada exitosamente', 'success');
        }
        document.querySelectorAll('.shape').forEach(s => {
            s.classList.remove('connect-source');
        });
        sourceShape = null;
        
        console.log(`✅ Conexión completada`);
    }
}
function getAllArrows() {
    return arrows;
}
function loadArrows(arrowsData) {
    arrowsLayer.innerHTML = '';
    arrows = [];
    
    arrowsData.forEach(arrowData => {
        arrows.push(arrowData);
        renderArrow(arrowData);
    });
    
    arrowIdCounter = arrows.length;
    console.log(`📥 Cargadas ${arrows.length} flechas`);
}
function clearAllArrows() {
    arrows = [];
    arrowsLayer.innerHTML = '';
    arrowIdCounter = 0;
    console.log('🧹 Flechas limpiadas');
}

console.log('✅ arrows.js cargado');