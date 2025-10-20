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
    if (downloadBtn) {
        downloadBtn.addEventListener('click', exportDiagramToJSON);
    }

    document.getElementById('downloadImgBtn').addEventListener('click', downloadAsImage);
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            document.getElementById('importInput').click();
        });
    }

    if (connectModeBtn) {
        connectModeBtn.addEventListener('click', toggleConnectMode);
    }

    const commentMainBtn = document.getElementById('commentMainBtn');
    const commentSubmenu = document.getElementById('commentSubmenu');
    if (commentMainBtn) {
        commentMainBtn.addEventListener('click', function() {
            if (commentSubmenu.style.display === 'none') {
                commentSubmenu.style.display = 'grid';
            } else {
                commentSubmenu.style.display = 'none';
            }
        });
    }

    const commentBtns = document.querySelectorAll('.comment-type-btn');
    commentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                commentModeActive = false;
                selectedCommentType = null;
                document.getElementById('canvas').style.cursor = 'crosshair';
                commentSubmenu.style.display = 'none';
                console.log('⚪ Modo comentario desactivado');
                return;
            }
            commentBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const type = this.dataset.type;
            activateCommentMode(type);
            commentSubmenu.style.display = 'none';
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
            importFromJSON(file, 
                (data) => {
                    console.log('✅ Callback éxito:', data.metadata);
                },
                (error) => {
                    console.error('❌ Callback error:', error);
                }
            );
            e.target.value = '';
        }
    });
}   
function setupShapeIcons() {
    shapeIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                selectedShapeType = null;
                console.log('⚪ Selección cancelada');
                return;
            }
            shapeIcons.forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            selectedShapeType = this.dataset.shape;
            
            console.log(`✏️ Figura seleccionada: ${selectedShapeType}`);
        });
    });
}
function setupCanvasEvents() {
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (commentModeActive) {
            createCommentBox(x, y);
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
    const comments = getAllComments();

    
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
        arrows: arrows,
        comments: comments
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
async function showSavedDiagrams() {
    const savedDiagrams = await getAllSavedDiagrams();
    if (savedDiagrams.length === 0) {
        showAlert('No hay diagramas guardados en PouchDB', 'error');
        return;
    }
    let message = 'Diagramas en PouchDB:\n\n';
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
            await loadDiagram(diagram._id);
            showAlert(`Diagrama "${diagram.name}" cargado desde PouchDB`, 'success');
        }
    }
}
function downloadAsImage() {
    const svgElement = document.getElementById('canvas');
    const clone = svgElement.cloneNode(true);
    // Remover el patrón de cuadrícula del clon
    const gridRect = clone.querySelector('rect[fill*="grid"]');
    if (gridRect) {
    gridRect.remove();
    }
    // Obtener estilos del CSS
    const cssStyles = `
        .shape-rect { fill: #3498db; stroke: #2980b9; stroke-width: 2; }
        .shape-diamond { fill: #e74c3c; stroke: #c0392b; stroke-width: 2; }
        .shape-ellipse { fill: #2ecc71; stroke: #27ae60; stroke-width: 2; }
        .shape-ellipse-end { fill: #34495e; stroke: #2c3e50; stroke-width: 2; }
        .shape-parallelogram { fill: #f39c12; stroke: #d68910; stroke-width: 2; }
        .shape-parallelogram-salida { fill: #9b59b6; stroke: #8e44ad; stroke-width: 2; }
        .shape-text { fill: white; font-size: 14px; font-weight: bold; text-anchor: middle; font-family: Arial; }
        .arrow { fill: none; stroke: #34495e; stroke-width: 2; }
        .arrow-label { fill: #34495e; font-size: 12px; font-weight: bold; font-family: Arial; }
    `;
    
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = cssStyles;
    clone.insertBefore(style, clone.firstChild);
    
    const svgData = new XMLSerializer().serializeToString(clone);
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 900;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1400, 900);
    
    const img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `diagrama_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showAlert('Imagen descargada correctamente', 'success');
        }, 'image/png');
    };
    
    img.onerror = function() {
        showAlert('Error al descargar imagen', 'error');
    };
    
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    img.src = URL.createObjectURL(blob);
}
function importFromJSON(file, successCallback, errorCallback) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.diagram) {
                throw new Error('Formato JSON inválido');
            }
            
            clearAllShapes();
            clearAllArrows();
            
            if (data.diagram.shapes) {
                loadShapes(data.diagram.shapes);
            }
            
            if (data.diagram.arrows) {
                loadArrows(data.diagram.arrows);
            }
            
            showAlert('Diagrama importado correctamente', 'success');
            console.log('✅ Diagrama importado:', data.metadata);
            
            if (successCallback) {
                successCallback(data);
            }
        } catch (error) {
            showAlert('Error al importar: ' + error.message, 'error');
            console.error('❌ Error:', error);
            if (errorCallback) {
                errorCallback(error);
            }
        }
    };
    
    reader.onerror = function() {
        showAlert('Error al leer el archivo', 'error');
        if (errorCallback) {
            errorCallback('Error al leer archivo');
        }
    };
    
    reader.readAsText(file);
}
function showSaveNotification(message) {
    const existingNotif = document.querySelector('.save-notification');
    if (existingNotif) existingNotif.remove();
    const notif = document.createElement('div');
    notif.className = 'save-notification';
    notif.textContent = message;
    
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}
 setInterval(() => {
        const shapes = getAllShapes();
        const arrows = getAllArrows();
        const comments = getAllComments();
        if (shapes.length > 0) {
            const autoName = `AutoGuardado_${new Date().toLocaleTimeString()}`;
            saveDiagram(autoName, { shapes, arrows, comments })
                .then(() => {
                    showSaveNotification('💾 Guardado automático');
                    console.log('✅ Autoguardado exitoso en PouchDB');
                })
                .catch(error => {
                    console.error('❌ Error en autoguardado:', error);
                    showAlert('Error al autoguardar', 'error');
                });
        }
    }, 30000); 
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
document.addEventListener('DOMContentLoaded', initApp);
console.log('✅ app.js cargado');
