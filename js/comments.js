let comments = [];
let commentIdCounter = 0;
let commentMode = false;
let isDraggingComment = false;
const commentsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
commentsLayer.setAttribute('id', 'comments-layer');
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const shapesLayer = document.getElementById('shapes-layer');
    canvas.insertBefore(commentsLayer, shapesLayer);
});
function toggleCommentMode() {
    commentMode = !commentMode;
    const btn = document.getElementById('commentBtn');
    const canvas = document.getElementById('canvas');
    
    if (commentMode) {
        btn.style.background = '#e67e22';
        canvas.style.cursor = 'text';
        showAlert('Click en el canvas para agregar comentario', 'success');
        console.log('💬 Modo comentario ACTIVADO');
    } else {
        btn.style.background = '#f39c12';
        canvas.style.cursor = 'crosshair';
        console.log('💬 Modo comentario DESACTIVADO');
    }
}
function createComment(x, y) {
    const commentId = `comment-${commentIdCounter++}`;
    const tipo = prompt(
        'Tipo de comentario:\n\n' +
        '1. Bucle\n' +
        '2. Decisión\n' +
        '3. Entrada/Salida\n' +
        '4. Proceso\n' +
        '5. Otro\n\n' +
        'Ingresa el número:',
        '1'
    );
    
    if (!tipo) return;
    
    const tipos = {
        '1': 'BUCLE',
        '2': 'DECISIÓN',
        '3': 'E/S',
        '4': 'PROCESO',
        '5': 'NOTA'
    };
    
    const tipoTexto = tipos[tipo] || 'NOTA';
    const texto = prompt(`Comentario de ${tipoTexto}:`, `Aquí se ejecuta un ${tipoTexto.toLowerCase()}`);
    
    if (!texto) return;
    
    const commentData = {
        id: commentId,
        tipo: tipoTexto,
        texto: texto,
        x: x,
        y: y,
        linkedShape: null
    };
    
    comments.push(commentData);
    renderComment(commentData);
    
    console.log(`💬 Comentario creado: ${tipoTexto}`);
}
function renderComment(data) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'comment-box');
    g.setAttribute('data-id', data.id);
    g.setAttribute('transform', `translate(${data.x}, ${data.y})`);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'comment-rect');
    rect.setAttribute('x', 0);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', 200);
    rect.setAttribute('height', 80);
    rect.setAttribute('rx', 5);
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('class', 'comment-title');
    title.setAttribute('x', 10);
    title.setAttribute('y', 18);
    title.textContent = `[${data.tipo}]`;
    const words = data.texto.split(' ');
    let line = '';
    let lineY = 38;
    
    words.forEach((word, i) => {
        const testLine = line + word + ' ';
        if (testLine.length > 30) {
            const textLine = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textLine.setAttribute('class', 'comment-text');
            textLine.setAttribute('x', 10);
            textLine.setAttribute('y', lineY);
            textLine.textContent = line;
            g.appendChild(textLine);
            
            line = word + ' ';
            lineY += 14;
        } else {
            line = testLine;
        }
        if (i === words.length - 1) {
            const textLine = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textLine.setAttribute('class', 'comment-text');
            textLine.setAttribute('x', 10);
            textLine.setAttribute('y', lineY);
            textLine.textContent = line;
            g.appendChild(textLine);
        }
    });
    
    g.appendChild(rect);
    g.appendChild(title);
    commentsLayer.appendChild(g);
    g.addEventListener('mousedown', startDragComment);
    g.addEventListener('contextmenu', deleteComment);
    g.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        editComment(data.id);
    });
}
function startDragComment(e) {
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    isDraggingComment = true;
    
    const commentGroup = e.currentTarget;
    const transform = commentGroup.getAttribute('transform');
    const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
    const currentX = parseFloat(match[1]);
    const currentY = parseFloat(match[2]);
    
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    
    const offsetX = (e.clientX - rect.left) - currentX;
    const offsetY = (e.clientY - rect.top) - currentY;
    
    const moveHandler = (e) => {
        if (!isDraggingComment) return;
        
        const rect = canvas.getBoundingClientRect();
        const newX = e.clientX - rect.left - offsetX;
        const newY = e.clientY - rect.top - offsetY;
        
        commentGroup.setAttribute('transform', `translate(${newX}, ${newY})`);
        
        const commentId = commentGroup.getAttribute('data-id');
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
            comment.x = newX;
            comment.y = newY;
        }
    };
    
    const upHandler = () => {
        isDraggingComment = false;
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
}
function editComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    const nuevoTexto = prompt('Editar comentario:', comment.texto);
    if (nuevoTexto && nuevoTexto.trim()) {
        comment.texto = nuevoTexto.trim();
        
        // Re-renderizar
        const commentGroup = document.querySelector(`[data-id="${commentId}"]`);
        if (commentGroup) {
            commentGroup.remove();
            renderComment(comment);
        }
        
        showAlert('Comentario actualizado', 'success');
    }
}
function deleteComment(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const commentGroup = e.currentTarget;
    const commentId = commentGroup.getAttribute('data-id');
    
    if (confirm('¿Eliminar este comentario?')) {
        comments = comments.filter(c => c.id !== commentId);
        commentGroup.remove();
        console.log(`🗑️ Comentario eliminado: ${commentId}`);
    }
}
function handleCommentClick(x, y) {
    if (!commentMode) return false;
    
    createComment(x, y);
    return true;
}
function getAllComments() {
    return comments;
}
function loadComments(commentsData) {
    comments = [];
    commentsLayer.innerHTML = '';
    
    commentsData.forEach(commentData => {
        comments.push(commentData);
        renderComment(commentData);
    });
    
    console.log(`📥 Cargados ${comments.length} comentarios`);
}
function clearAllComments() {
    comments = [];
    commentsLayer.innerHTML = '';
    commentIdCounter = 0;
}
console.log('✅ comments.js cargado');