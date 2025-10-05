const canvas = document.getElementById('canvas');
const shapeIcons = document.querySelectorAll('.shape-icon');
const connectModeBtn = document.getElementById('connectModeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const clearBtn = document.getElementById('clearBtn');
function initApp() {
    console.log('🚀 Iniciando Editor de Diagramas de Flujo v2.0...');
    
    setupShapeIcons();
    setupCanvasEvents();
    setupActionButtons();
    updateStats();   
    console.log('✅ Aplicación iniciada correctamente');
    console.log('📋 Funcionalidades DÍA 2:');
    console.log('   ✓ Iconos SVG en panel');
    console.log('   ✓ Sistema de conexiones/flechas');
    console.log('   ✓ Validación: 1 inicio, 1 fin');
    console.log('   ✓ Editar texto (doble click)');
    console.log('   ✓ Etiquetas en flechas (Sí/No)');
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
    canvas.addEventListener('click', function(e) {
        if (connectMode) return;
        if (e.target.closest('.shape')) return;
        if (!selectedShapeType) {
            showAlert('Primero selecciona un tipo de figura', 'error');
            return;
        }
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        createShape(selectedShapeType, x, y);
    });
}
function setupActionButtons() {
    connectModeBtn.addEventListener('click', function() {
        toggleConnectMode();
    });
    downloadBtn.addEventListener('click', function() {
        exportDiagramToJSON();
    });
    saveBtn.addEventListener('click', function() {
        const shapes = getAllShapes();
        const arrows = getAllArrows();
        
        if (shapes.length === 0) {
            showAlert('No hay figuras para guardar', 'error');
            return;
        }
        
        const name = prompt('Nombre del diagrama:', `Diagrama_${new Date().toLocaleDateString()}`);
        
        if (name) {
            if (saveDiagram(name, { shapes, arrows })) {
                showAlert(`Diagrama "${name}" guardado correctamente`, 'success');
            }
        }
    });
    loadBtn.addEventListener('click', function() {
        showSavedDiagrams();
    });
    clearBtn.addEventListener('click', function() {
        clearAllShapes();
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
            version: '2.0',
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
    const errors = [];
    const startShapes = shapes.filter(s => s.type === 'inicio');
    if (startShapes.length === 0) {
        errors.push('❌ Falta figura de INICIO');
    }
    const endShapes = shapes.filter(s => s.type === 'fin');
    if (endShapes.length === 0) {
        errors.push('❌ Falta figura de FIN');
    }
    if (shapes.length < 2) {
        errors.push('⚠️ El diagrama tiene muy pocas figuras');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}
function showSavedDiagrams() {
    const savedDiagrams = getAllSavedDiagrams();
    
    if (savedDiagrams.length === 0) {
        showAlert('No hay diagramas guardados', 'error');
        return;
    }
    let message = 'Diagramas guardados:\n\n';
    savedDiagrams.forEach((diagram, index) => {
        const date = new Date(diagram.createdAt).toLocaleString();
        message += `${index + 1}. ${diagram.name}\n`;
        message += `   Figuras: ${diagram.data.shapes?.length || 0} | `;
        message += `Flechas: ${diagram.data.arrows?.length || 0}\n`;
        message += `   Fecha: ${date}\n\n`;
    });
    
    message += '\nIngresa el número del diagrama a cargar (0 para cancelar):';
    
    const choice = prompt(message);
    const index = parseInt(choice) - 1;
    
    if (index >= 0 && index < savedDiagrams.length) {
        const diagram = savedDiagrams[index];
        
        if (confirm(`¿Cargar "${diagram.name}"? Se perderá el diagrama actual.`)) {
            loadDiagram(diagram.id);
            showAlert(`Diagrama "${diagram.name}" cargado`, 'success');
        }
    }
}
function updateStats() {
    const shapes = getAllShapes();
    const arrows = getAllArrows();
    document.getElementById('shapeCount').textContent = shapes.length;
    document.getElementById('arrowCount').textContent = arrows.length;
    const startCount = shapes.filter(s => s.type === 'inicio').length;
    const endCount = shapes.filter(s => s.type === 'fin').length;
    document.getElementById('startCount').textContent = startCount;
    document.getElementById('endCount').textContent = endCount;
    const startEl = document.getElementById('startCount');
    const endEl = document.getElementById('endCount');
    startEl.style.color = startCount === 1 ? '#2ecc71' : '#e74c3c';
    endEl.style.color = endCount === 1 ? '#2ecc71' : '#e74c3c';
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
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveBtn.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            downloadBtn.click();
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
        if (e.key === 'Delete' && e.shiftKey) {
            e.preventDefault();
            clearBtn.click();
        }
    });
}
function showWelcomeMessage() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  📊 EDITOR DE DIAGRAMAS DE FLUJO - DÍA 2');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('✨ Nuevas funcionalidades:');
    console.log('  ✓ Iconos SVG en el panel lateral');
    console.log('  ✓ Sistema de flechas/conexiones entre figuras');
    console.log('  ✓ Validación: Solo 1 inicio y 1 fin');
    console.log('  ✓ Editar texto con doble click');
    console.log('  ✓ Etiquetas en flechas (Sí/No)');
    console.log('  ✓ Estadísticas en tiempo real');
    console.log('');
    console.log('⌨️  Atajos:');
    console.log('  • Ctrl+S: Guardar');
    console.log('  • Ctrl+E: Exportar JSON');
    console.log('  • Ctrl+C: Modo conexión');
    console.log('  • ESC: Cancelar/Deseleccionar');
    console.log('  • Shift+Del: Limpiar canvas');
    console.log('  • Doble click: Editar texto');
    console.log('');
    console.log('🎯 Cómo usar:');
    console.log('  1. Click en un icono para seleccionar figura');
    console.log('  2. Click en el canvas para colocarla');
    console.log('  3. Click en "Modo Conectar"');
    console.log('  4. Click en figura origen, luego en destino');
    console.log('  5. Arrastra figuras para reorganizar');
    console.log('  6. Click derecho para eliminar');
    console.log('═══════════════════════════════════════════════════');
}
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupKeyboardShortcuts();
    showWelcomeMessage();
});
console.log('✅ app.js cargado');