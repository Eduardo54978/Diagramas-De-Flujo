let shapes = [];
let shapeIdCounter = 0;
let selectedShapeType = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
const shapesLayer = document.getElementById('shapes-layer');
function createShape(type, x, y) {
    const shapeId = `shape-${shapeIdCounter++}`;
    
    const shapeData = {
        id: shapeId,
        type: type,
        x: x,
        y: y,
        text: getDefaultText(type)
    };
    
    shapes.push(shapeData);
    renderShape(shapeData);
    
    console.log(`✅ Figura creada: ${type} en (${x}, ${y})`);
}
function getDefaultText(type) {
    const texts = {
        'inicio': 'INICIO',
        'proceso': 'PROCESO',
        'decision': '¿CONDICIÓN?',
        'entrada': 'ENTRADA',
        'salida': 'SALIDA',
        'fin': 'FIN'
    };
    return texts[type] || type.toUpperCase();
}
function renderShape(data) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'shape');
    g.setAttribute('data-id', data.id);
    g.setAttribute('data-type', data.type);
    g.setAttribute('transform', `translate(${data.x}, ${data.y})`);
    let shapeElement;
    switch(data.type) {
        case 'inicio':
        case 'fin':
            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            shapeElement.setAttribute('cx', 0);
            shapeElement.setAttribute('cy', 0);
            shapeElement.setAttribute('rx', 60);
            shapeElement.setAttribute('ry', 40);
            shapeElement.setAttribute('class', 'shape-ellipse');
            break;
        case 'proceso':
            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shapeElement.setAttribute('x', -70);
            shapeElement.setAttribute('y', -35);
            shapeElement.setAttribute('width', 140);
            shapeElement.setAttribute('height', 70);
            shapeElement.setAttribute('class', 'shape-rect');
            break;
            
        case 'decision':
            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shapeElement.setAttribute('points', '0,-50 70,0 0,50 -70,0');
            shapeElement.setAttribute('class', 'shape-diamond');
            break;
            
        case 'entrada':
        case 'salida':
            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shapeElement.setAttribute('points', '-60,-35 70,-35 60,35 -70,35');
            shapeElement.setAttribute('class', 'shape-parallelogram');
            break;
    }
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'shape-text');
    text.setAttribute('x', 0);
    text.setAttribute('y', 5);
    text.textContent = data.text;
    g.appendChild(shapeElement);
    g.appendChild(text);
    shapesLayer.appendChild(g);
    attachShapeEvents(g);
}
function attachShapeEvents(shapeGroup) {
    shapeGroup.addEventListener('mousedown', startDrag);
    shapeGroup.addEventListener('contextmenu', deleteShape);
    shapeGroup.addEventListener('dblclick', function(e) {
        console.log('🔧 Función de edición de texto - Próximamente');
    });
}
function startDrag(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    isDragging = true;
    const shapeGroup = e.currentTarget;
    const transform = shapeGroup.getAttribute('transform');
    const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
    const currentX = parseFloat(match[1]);
    const currentY = parseFloat(match[2]);
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    dragOffset.x = (e.clientX - rect.left) - currentX;
    dragOffset.y = (e.clientY - rect.top) - currentY;
    shapeGroup.classList.add('selected');
    const moveHandler = (e) => {
        if (!isDragging) return;
        
        const rect = canvas.getBoundingClientRect();
        const newX = e.clientX - rect.left - dragOffset.x;
        const newY = e.clientY - rect.top - dragOffset.y;
        
        shapeGroup.setAttribute('transform', `translate(${newX}, ${newY})`);
        const shapeId = shapeGroup.getAttribute('data-id');
        const shape = shapes.find(s => s.id === shapeId);
        if (shape) {
            shape.x = newX;
            shape.y = newY;
        }
    };
    const upHandler = () => {
        isDragging = false;
        shapeGroup.classList.remove('selected');
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
}
function deleteShape(e) {
    e.preventDefault();
    const shapeGroup = e.currentTarget;
    const shapeId = shapeGroup.getAttribute('data-id');
    if (confirm('¿Eliminar esta figura del diagrama?')) {
        shapes = shapes.filter(s => s.id !== shapeId);
        shapeGroup.remove();
        
        console.log(`🗑️ Figura eliminada: ${shapeId}`);
    }
}
function clearAllShapes() {
    if (shapes.length === 0) {
        alert('El canvas ya está vacío');
        return;
    }
    
    if (confirm('¿Limpiar TODO el diagrama? Esta acción no se puede deshacer.')) {
        shapes = [];
        shapesLayer.innerHTML = '';
        shapeIdCounter = 0;
        console.log('🧹 Canvas limpiado');
    }
}
function getAllShapes() {
    return shapes;
}
function loadShapes(shapesData) {
    clearAllShapes();
    shapesLayer.innerHTML = '';
    
    shapesData.forEach(shapeData => {
        shapes.push(shapeData);
        renderShape(shapeData);
    });
    
    shapeIdCounter = shapes.length;
    console.log(`📥 Cargadas ${shapes.length} figuras`);
}
console.log('✅ shapes.js cargado');