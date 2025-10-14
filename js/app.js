const canvas = document.getElementById('canvas');
const shapeIcons = document.querySelectorAll('.shape-icon');
const connectModeBtn = document.getElementById('connectModeBtn');
const downloadBtn = document.getElementById('downloadBtn');
function initApp() {
    console.log('🚀 Iniciando Editor de Diagramas de Flujo v3.0...');
    
    setupShapeIcons();
    setupCanvasEvents();
    setupButtons();
    setupImportInput();
    updateStats();
    
    console.log('✅ Aplicación iniciada correctamente');
    console.log('📋 Funcionalidades DÍA 3:');
    console.log('   ✓ Iconos SVG en panel');
    console.log('   ✓ Sistema de conexiones/flechas');
    console.log('   ✓ Validación completa del diagrama');
    console.log('   ✓ Editar texto (doble click)');
    console.log('   ✓ Importar archivos JSON');
    console.log('   ✓ Exportar con validación');
}
function setupButtons() {
    downloadBtn.addEventListener('click', exportDiagramToJSON);
    document.getElementById('importBtn').addEventListener('click', function() {
        document.getElementById('importInput').click();
    });
    connectModeBtn.addEventListener('click', toggleConnectMode);
    document.getElementById('docsBtn').addEventListener('click', function() {
        document.getElementById('docsPanel').style.display = 'flex';
        const savedDocs = localStorage.getItem('flowchart_docs');
        if (savedDocs) {
            document.getElementById('docsText').value = savedDocs;
        }
    });
    document.getElementById('docsClose').addEventListener('click', function() {
        document.getElementById('docsPanel').style.display = 'none';
    });
    document.getElementById('docsSave').addEventListener('click', function() {
        const docsText = document.getElementById('docsText').value;
        localStorage.setItem('flowchart_docs', docsText);
        showAlert('Comentarios guardados', 'success');
    });
    document.querySelectorAll('.comment-type-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.comment-type-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activateCommentMode(this.dataset.type);
    });
});
}
function setupImportInput() {
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.id = 'importInput';
    document.body.appendChild(importInput);

    importInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            importFromJSON(file);
            e.target.value = '';
        }
    });
}
function setupShapeIcons() {
    shapeIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            shapeIcons.forEach(i => {
                i.classList.remove('selected');
            });
            this.classList.add('selected');
            selectedShapeType = this.dataset.shape;
            
            console.log(`✏️ Figura seleccionada: ${selectedShapeType}`);
        });
    });
}

function setupCanvasEvents() {
        if (commentModeActive) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            createCommentBox(x, y);
            return;
        }
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (commentMode) {
            e.stopPropagation();
            createComment(x, y);
            return;
        }
        
        if (connectMode) return;
        if (e.target.closest('.shape')) return;
        
        if (!selectedShapeType) {
            showAlert('Primero selecciona un tipo de figura', 'error');
            return;
        }
        
        createShape(selectedShapeType, x, y);
    });
}
function exportDiagramToJSON() {
    const shapes = getAllShapes();
    const arrows = getAllArrows();
    
    if (shapes.length === 0) {
        showAlert('No hay figuras para exportar', 'error');
        return;
    }
    
    const validation = validateDiagram();
    if (!validation.valid) {
        const confirmExport = confirm(
            `⚠️ Advertencias:\n${validation.errors.join('\n')}\n\n¿Exportar de todas formas?`
        );
        if (!confirmExport) return;
    }
    
    const exportData = {
        metadata: {
            appName: 'Editor de Diagramas de Flujo',
            version: '3.0',
            exportDate: new Date().toISOString(),
            shapeCount: shapes.length,
            arrowCount: arrows.length
        },
        diagram: {
            shapes: shapes,
            arrows: arrows
        }
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `diagrama_${timestamp}.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert(`Archivo descargado: ${filename}`, 'success');
    console.log(`📥 Exportado: ${filename}`);
}
function validateDiagram() {
    const shapes = getAllShapes();
    const arrows = getAllArrows();
    const errors = [];
    const warnings = [];
    
    const startShapes = shapes.filter(s => s.type === 'inicio');
    if (startShapes.length === 0) {
        errors.push('❌ Falta figura de INICIO');
    } else if (startShapes.length > 1) {
        errors.push('❌ Solo debe haber UN inicio');
    }
    
    const endShapes = shapes.filter(s => s.type === 'fin');
    if (endShapes.length === 0) {
        errors.push('❌ Falta figura de FIN');
    } else if (endShapes.length > 1) {
        errors.push('❌ Solo debe haber UN fin');
    }
    
    if (shapes.length < 3) {
        warnings.push('⚠️ El diagrama tiene muy pocas figuras');
    }
    
    shapes.forEach(shape => {
        const hasConnection = arrows.some(a => 
            a.from === shape.id || a.to === shape.id
        );
        
        if (!hasConnection && shape.type !== 'inicio' && shape.type !== 'fin') {
            warnings.push(`⚠️ Figura "${shape.text}" sin conexiones`);
        }
    });
    
    if (startShapes.length === 1) {
        const startHasOutput = arrows.some(a => a.from === startShapes[0].id);
        if (!startHasOutput) {
            errors.push('❌ INICIO debe tener una flecha de salida');
        }
    }
    
    if (endShapes.length === 1) {
        const endHasInput = arrows.some(a => a.to === endShapes[0].id);
        if (!endHasInput) {
            errors.push('❌ FIN debe tener una flecha de entrada');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}
function updateStats() {
    const shapes = getAllShapes();
    const arrows = getAllArrows();
    
    const startCount = shapes.filter(s => s.type === 'inicio').length;
    const endCount = shapes.filter(s => s.type === 'fin').length;
    
    const startEl = document.getElementById('startCount');
    const endEl = document.getElementById('endCount');
    
    if (startEl) {
        document.getElementById('shapeCount').textContent = shapes.length;
        document.getElementById('arrowCount').textContent = arrows.length;
        document.getElementById('startCount').textContent = startCount;
        document.getElementById('endCount').textContent = endCount;
        
        startEl.style.color = startCount === 1 ? '#2ecc71' : '#e74c3c';
        endEl.style.color = endCount === 1 ? '#2ecc71' : '#e74c3c';
    }
}
function showAlert(message, type = 'success') {
    const existingAlerts = document.querySelectorAll('.validation-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `validation-alert ${type}`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            downloadBtn.click();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            document.getElementById('importBtn').click();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            connectModeBtn.click();
        }
        
        if (e.key === 'Escape') {
            if (connectMode) {
                connectModeBtn.click();
            } else {
                selectedShapeType = null;
                shapeIcons.forEach(i => i.classList.remove('selected'));
            }
            console.log('⚪ Selección cancelada');
        }
    });
}
function showWelcomeMessage() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  📊 EDITOR DE DIAGRAMAS DE FLUJO - DÍA 3');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('✨ Funcionalidades:');
    console.log('  ✓ Iconos SVG en el panel lateral');
    console.log('  ✓ Sistema de flechas/conexiones');
    console.log('  ✓ Validación completa (inicio/fin, conexiones)');
    console.log('  ✓ Editar texto con doble click');
    console.log('  ✓ Importar archivos JSON');
    console.log('  ✓ Exportar con validación');
    console.log('');
    console.log('⌨️  Atajos:');
    console.log('  • Ctrl+E: Exportar JSON');
    console.log('  • Ctrl+I: Importar JSON');
    console.log('  • Ctrl+C: Modo conexión');
    console.log('  • ESC: Cancelar/Deseleccionar');
    console.log('  • Doble click: Editar texto');
    console.log('═══════════════════════════════════════════════════');
}
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupKeyboardShortcuts();
    showWelcomeMessage();
});

console.log('✅ app.js cargado');