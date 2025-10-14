let comments = [];
let commentIdCounter = 0;
let commentModeActive = false;
let selectedCommentType = null;
const commentsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
commentsLayer.setAttribute('id', 'comments-layer');
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const shapesLayer = document.getElementById('shapes-layer');
    canvas.insertBefore(commentsLayer, shapesLayer);
});
function activateCommentMode(type) {
    commentModeActive = true;
    selectedCommentType = type;
    document.getElementById('canvas').style.cursor = 'crosshair';
    
    showAlert(`Click en el canvas para añadir comentario de ${type}`, 'success');
}
function createCommentBox(x, y) {
    if (!commentModeActive) return;
    
    const texto = prompt(`Escribe el comentario (${selectedCommentType.toUpperCase()}):`, '');
    
    if (!texto || texto.trim() === '') {
        commentModeActive = false;
        return;
    }
    
    const commentId = `comment-${commentIdCounter++}`;   
    const commentData = {
        id: commentId,
        type: selectedCommentType,
        text: texto.trim(),
        x: x,
        y: y
    };

    comments.push(commentData);
    renderCommentBox(commentData);    
    commentModeActive = false;
    selectedCommentType = null;
    document.getElementById('canvas').style.cursor = 'crosshair';
    document.querySelectorAll('.comment-type-btn').forEach(b => b.classList.remove('active'));
}
function renderCommentBox(data) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'comment-box');
    g.setAttribute('data-id', data.id);
    g.setAttribute('transform', `translate(${data.x}, ${data.y})`);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'comment-rect');
    rect.setAttribute('x', 0);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', 180);
    rect.setAttribute('height', 100);
    rect.setAttribute('rx', 5);
    g.appendChild(rect);
    const icons = {
        'funcion': '⚙️',
        'bucle': '🔄',
        'decision': '❓',
        'general': '📄'
    };
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('class', 'comment-title');
    title.setAttribute('x', 10);
    title.setAttribute('y', 20);
    title.textContent = `${icons[data.type]} ${data.type.toUpperCase()}`;
    g.appendChild(title);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 10);
    line.setAttribute('y1', 28);
    line.setAttribute('x2', 170);
    line.setAttribute('y2', 28);
    line.setAttribute('stroke', '#f39c12');
    line.setAttribute('stroke-width', 1);
    g.appendChild(line);
    const words = data.text.split(' ');
    let line_text = '';
    let y_pos = 45;
    words.forEach((word, i) => {
        const test = line_text + word + ' ';
        if (test.length > 25) {
            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t.setAttribute('class', 'comment-text');
            t.setAttribute('x', 10);
            t.setAttribute('y', y_pos);
            t.textContent = line_text.trim();
            g.appendChild(t);
            
            line_text = word + ' ';
            y_pos += 14;
        } else {
            line_text = test;
        }
        
        if (i === words.length - 1 && line_text.trim()) {
            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t.setAttribute('class', 'comment-text');
            t.setAttribute('x', 10);
            t.setAttribute('y', y_pos);
            t.textContent = line_text.trim();
            g.appendChild(t);
        }
    });
    
    commentsLayer.appendChild(g);
    g.addEventListener('mousedown', startDragComment);
    g.addEventListener('contextmenu', deleteComment);
}
function startDragComment(e) {
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const g = e.currentTarget;
    const transform = g.getAttribute('transform');
    const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
    const cx = parseFloat(match[1]);
    const cy = parseFloat(match[2]);
    
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    
    const ox = (e.clientX - rect.left) - cx;
    const oy = (e.clientY - rect.top) - cy;
    
    const moveHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const nx = e.clientX - rect.left - ox;
        const ny = e.clientY - rect.top - oy;
        
        g.setAttribute('transform', `translate(${nx}, ${ny})`);
        
        const id = g.getAttribute('data-id');
        const comment = comments.find(c => c.id === id);
        if (comment) {
            comment.x = nx;
            comment.y = ny;
        }
    };
    
    const upHandler = () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
}
function deleteComment(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const g = e.currentTarget;
    const id = g.getAttribute('data-id');
    
    if (confirm('¿Eliminar comentario?')) {
        comments = comments.filter(c => c.id !== id);
        g.remove();
    }
}

function getAllComments() {
    return comments;
}

function clearAllComments() {
    comments = [];
    commentsLayer.innerHTML = '';
}

console.log('✅ comments.js cargado');