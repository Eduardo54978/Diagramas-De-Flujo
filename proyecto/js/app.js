const canvas = document.getElementById('canvas');
const shapeButtons = document.querySelectorAll('.shape-btn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
function initApp() {
    console.log('🚀 Iniciando Editor de Diagramas de Flujo...');
    
    setupShapeButtons();
    setupCanvasEvents();
    setupActionButtons();
    
    console.log('✅ Aplicación iniciada correctamente');
    console.log('📋 Funcionalidades disponibles:');
    console.log('   - Crear figuras (6 tipos)');
    console.log('   - Arrastrar y mover figuras');
    console.log('   - Eliminar con click derecho');
    console.log('   - Guardar/Cargar diagramas');
    console.log('   - Exportar a JSON');
}
function setupShapeButtons() {
    shapeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            shapeButtons.forEach(b => {
                b.style.opacity = '1';
                b.style.transform = 'scale(1)';
            });
            this.style.opacity = '0.7';
            this.style.transform = 'scale(0.95)';
            selectedShapeType = this.dataset.shape;
            console.log(`✏️ Figura seleccionada: ${selectedShapeType}`);
        });
    });
}
function setupCanvasEvents() {
    canvas.addEventListener('click', function(e) {
        if (e.target.closest('.shape')) return;
        if (!selectedShapeType) {
            console.log('⚠️ Primero selecciona un tipo de figura');
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        createShape(selectedShapeType, x, y);
    });
}
function setupActionButtons() {
    saveBtn.addEventListener('click', function() {
        const shapes = getAllShapes();
        
        if (shapes.length === 0) {
            alert('No hay figuras para guardar');
            return;
        }
        
        const name = prompt('Nombre del diagrama:', `Diagrama_${new Date().toLocaleDateString()}`);
        
        if (name) {
            if (saveDiagram(name)) {
                alert(`✅ Diagrama "${name}" guardado correctamente`);
                showSavedDiagrams();
            }
        }
    });
    loadBtn.addEventListener('click', function() {
        showSavedDiagrams();
    });
    exportBtn.addEventListener('click', function() {
        exportToJSON();
    });
    clearBtn.addEventListener('click', function() {
        clearAllShapes();
    });
}
function showSavedDiagrams() {
    const savedDiagrams = getAllSavedDiagrams();
    
    if (savedDiagrams.length === 0) {
        alert('No hay diagramas guardados');
        return;
    }
    let message = 'Diagramas guardados:\n\n';
    savedDiagrams.forEach((diagram, index) => {
        const date = new Date(diagram.createdAt).toLocaleString();
        message += `${index + 1}. ${diagram.name}\n`;
        message += `   Figuras: ${diagram.shapes.length} | Fecha: ${date}\n\n`;
    });
    
    message += '\nIngresa el número del diagrama a cargar (0 para cancelar):';
    
    const choice = prompt(message);
    const index = parseInt(choice) - 1;
    
    if (index >= 0 && index < savedDiagrams.length) {
        const diagram = savedDiagrams[index];
        
        if (confirm(`¿Cargar "${diagram.name}"? Se perderá el diagrama actual.`)) {
            loadDiagram(diagram.id);
            alert(`✅ Diagrama "${diagram.name}" cargado`);
        }
    }
}
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveBtn.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportBtn.click();
        }
        if (e.key === 'Delete' && e.shiftKey) {
            e.preventDefault();
            clearBtn.click();
        }
        if (e.key === 'Escape') {
            selectedShapeType = null;
            shapeButtons.forEach(b => {
                b.style.opacity = '1';
                b.style.transform = 'scale(1)';
            });
            console.log('⚪ Selección cancelada');
        }
    });
}
function showWelcomeMessage() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  📊 EDITOR DE DIAGRAMAS DE FLUJO - DÍA 1');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('✨ Funcionalidades:');
    console.log('  • 6 tipos de figuras (inicio, proceso, decisión, etc.)');
    console.log('  • Arrastrar y soltar figuras');
    console.log('  • Guardar/Cargar con localStorage');
    console.log('  • Exportar a JSON');
    console.log('  • Diseño responsive');
    console.log('');
    console.log('⌨️  Atajos:');
    console.log('  • Ctrl+S: Guardar');
    console.log('  • Ctrl+E: Exportar');
    console.log('  • ESC: Deseleccionar figura');
    console.log('  • Shift+Del: Limpiar canvas');
    console.log('');
    console.log('🎯 Próximos pasos (Día 2):');
    console.log('  • Sistema de conexiones/flechas');
    console.log('  • Validación (1 inicio, 1 fin)');
    console.log('  • Editar texto de figuras');
    console.log('═══════════════════════════════════════════════════');
}
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupKeyboardShortcuts();
    showWelcomeMessage();
});
console.log('✅ app.js cargado');