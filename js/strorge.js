const STORAGE_KEY = 'flowchart_diagrams';
function saveDiagram(name, data) {
    try {
        const diagramName = name || `Diagrama_${new Date().toISOString().split('T')[0]}`;
        const savedDiagrams = getAllSavedDiagrams();
        const newDiagram = {
            id: Date.now(),
            name: diagramName,
            data: {
                shapes: data.shapes || [],
                arrows: data.arrows || []
            },
            createdAt: new Date().toISOString(),
            version: '2.0'
        };
        savedDiagrams.push(newDiagram);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDiagrams));
        
        console.log(`💾 Diagrama guardado: ${diagramName}`);
        console.log(`   Figuras: ${data.shapes.length}, Flechas: ${data.arrows.length}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error al guardar:', error);
        
        if (error.name === 'QuotaExceededError') {
            alert('Error: El almacenamiento está lleno. Elimina diagramas antiguos.');
        } else {
            alert('Error al guardar el diagrama.');
        }
        return false;
    }
}
function loadDiagram(diagramId) {
    try {
        const savedDiagrams = getAllSavedDiagrams();
        const diagram = savedDiagrams.find(d => d.id === diagramId);
        if (diagram) {
            if (diagram.data.shapes) {
                loadShapes(diagram.data.shapes);
            }
            if (diagram.data.arrows) {
                setTimeout(() => {
                    loadArrows(diagram.data.arrows);
                }, 100);
            }
            
            updateStats();
            console.log(`📂 Diagrama cargado: ${diagram.name}`);
            return diagram;
        } else {
            console.warn('⚠️ Diagrama no encontrado');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error al cargar:', error);
        alert('Error al cargar el diagrama.');
        return null;
    }
}
function getAllSavedDiagrams() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('❌ Error al leer diagramas:', error);
        return [];
    }
}
function deleteSavedDiagram(diagramId) {
    try {
        let savedDiagrams = getAllSavedDiagrams();
        savedDiagrams = savedDiagrams.filter(d => d.id !== diagramId);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDiagrams));
        console.log(`🗑️ Diagrama eliminado: ${diagramId}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error al eliminar:', error);
        return false;
    }
}
function exportToJSON(data, filename = null) {
    try {
        const shapes = data.shapes || [];
        const arrows = data.arrows || [];
        
        if (shapes.length === 0) {
            alert('No hay figuras para exportar');
            return;
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
        const name = filename || `diagrama_${timestamp}.json`;
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`📥 Exportado: ${name}`);
    } catch (error) {
        console.error('❌ Error al exportar:', error);
        alert('Error al exportar el diagrama.');
    }
}
function importFromJSON(file) {
    if (!file.name.endsWith('.json')) {
        showAlert('Solo se permiten archivos .JSON', 'error');
        return;
    }    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.diagram || !data.diagram.shapes) {
                throw new Error('Formato inválido');
            }
            if (shapes.length > 0) {
                if (!confirm('¿Importar archivo? Se perderá el diagrama actual.')) {
                    return;
                }
            }
            clearAllShapes();
            loadShapes(data.diagram.shapes);
            if (data.diagram.arrows && data.diagram.arrows.length > 0) {
                setTimeout(() => {
                    loadArrows(data.diagram.arrows);
                    updateStats();
                }, 150);
            }
            
            showAlert(`✅ Importado: ${data.diagram.shapes.length} figuras`, 'success');
            console.log('📤 Diagrama importado correctamente');
            
        } catch (error) {
            console.error('❌ Error al importar:', error);
            showAlert('Archivo JSON inválido o corrupto', 'error');
        }
    };
    
    reader.onerror = function() {
        showAlert('Error al leer el archivo', 'error');
    };
    
    reader.readAsText(file);
}
function getStorageInfo() {
    try {
        const diagrams = getAllSavedDiagrams();
        const data = localStorage.getItem(STORAGE_KEY);
        const sizeInBytes = new Blob([data || '']).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);       
        return {
            diagramCount: diagrams.length,
            totalSize: sizeInKB,
            diagrams: diagrams
        };
    } catch (error) {
        console.error('❌ Error al obtener info de almacenamiento:', error);
        return {
            diagramCount: 0,
            totalSize: 0,
            diagrams: []
        };
    }
}
function clearAllStorage() {
    if (confirm('⚠️ ¿Eliminar TODOS los diagramas guardados? Esta acción no se puede deshacer.')) {
        try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('🧹 Almacenamiento limpiado');
            alert('Todos los diagramas guardados han sido eliminados.');
            return true;
        } catch (error) {
            console.error('❌ Error al limpiar almacenamiento:', error);
            return false;
        }
    }
    return false;
}

console.log('✅ storage.js cargado');