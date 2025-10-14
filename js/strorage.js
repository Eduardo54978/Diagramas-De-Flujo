let db;

try {
    db = new PouchDB('flowchart_diagrams');
    console.log('✅ PouchDB inicializada');
} catch (error) {
    console.error('❌ Error al iniciar PouchDB:', error);
    alert('Error al iniciar base de datos local');
}
async function saveDiagram(name, data) {
    try {
        const diagramName = name || `Diagrama_${new Date().toISOString().split('T')[0]}`;
        
        const newDiagram = {
            _id: `diagram_${Date.now()}`,
            name: diagramName,
            data: {
                shapes: data.shapes || [],
                arrows: data.arrows || [],
                comments: data.comments || []
            },
            createdAt: new Date().toISOString(),
            version: '5.0'
        };
        
        const response = await db.put(newDiagram);
        
        console.log(`💾 Diagrama guardado en PouchDB: ${diagramName}`);
        console.log(`   ID: ${response.id}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error al guardar en PouchDB:', error);
        alert('Error al guardar el diagrama en PouchDB');
        return false;
    }
}
async function loadDiagram(diagramId) {
    try {
        const diagram = await db.get(diagramId);
        
        if (diagram.data.shapes) {
            loadShapes(diagram.data.shapes);
        }
        
        if (diagram.data.arrows) {
            setTimeout(() => {
                loadArrows(diagram.data.arrows);
            }, 100);
        }
        
        if (diagram.data.comments) {
            setTimeout(() => {
                loadComments(diagram.data.comments);
            }, 150);
        }
        
        updateStats();
        console.log(`📂 Diagrama cargado desde PouchDB: ${diagram.name}`);
        return diagram;
        
    } catch (error) {
        console.error('❌ Error al cargar desde PouchDB:', error);
        alert('Error al cargar el diagrama');
        return null;
    }
}
async function getAllSavedDiagrams() {
    try {
        const result = await db.allDocs({
            include_docs: true,
            startkey: 'diagram_',
            endkey: 'diagram_\uffff'
        });
        
        return result.rows.map(row => row.doc);
        
    } catch (error) {
        console.error('❌ Error al obtener diagramas:', error);
        return [];
    }
}
async function deleteSavedDiagram(diagramId) {
    try {
        const doc = await db.get(diagramId);
        await db.remove(doc);
        
        console.log(`🗑️ Diagrama eliminado de PouchDB: ${diagramId}`);
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
        const comments = data.comments || [];
        
        if (shapes.length === 0) {
            alert('No hay figuras para exportar');
            return;
        }
        
        const exportData = {
            metadata: {
                appName: 'Editor de Diagramas de Flujo',
                version: '5.0',
                exportDate: new Date().toISOString(),
                shapeCount: shapes.length,
                arrowCount: arrows.length,
                commentCount: comments.length
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
                }, 100);
            }
            
            if (data.diagram.comments && data.diagram.comments.length > 0) {
                setTimeout(() => {
                    loadComments(data.diagram.comments);
                }, 150);
            }
            
            setTimeout(() => {
                updateStats();
            }, 200);
            
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
async function getStorageInfo() {
    try {
        const info = await db.info();
        const diagrams = await getAllSavedDiagrams();
        
        return {
            diagramCount: diagrams.length,
            dbName: info.db_name,
            docCount: info.doc_count,
            updateSeq: info.update_seq
        };
    } catch (error) {
        console.error('❌ Error al obtener info:', error);
        return {
            diagramCount: 0,
            dbName: 'flowchart_diagrams',
            docCount: 0,
            updateSeq: 0
        };
    }
}
async function clearAllStorage() {
    if (confirm('⚠️ ¿Eliminar TODOS los diagramas de PouchDB? Esta acción no se puede deshacer.')) {
        try {
            await db.destroy();
            db = new PouchDB('flowchart_diagrams');
            console.log('🧹 PouchDB limpiada y reinicializada');
            alert('Todos los diagramas han sido eliminados.');
            return true;
        } catch (error) {
            console.error('❌ Error al limpiar PouchDB:', error);
            return false;
        }
    }
    return false;
}

console.log('✅ storage.js con PouchDB cargado');