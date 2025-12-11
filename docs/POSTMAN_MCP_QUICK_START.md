# Postman MCP - Quick Start Guide

## Configuración Rápida para Windows

### Paso 1: Campo "Enter command or paste JSON config"

En el campo que ves en Postman, ingresa uno de estos formatos:

**Opción A: Comando Simple (Más Fácil)**
```
python C:/Test/AI/AI Learning with AI/backend/mcp_bridge_server.py
```

**Si Python no está en PATH, usa ruta completa:**
```
C:/Python39/python.exe C:/Test/AI/AI Learning with AI/backend/mcp_bridge_server.py
```

**Opción B: Formato JSON (Si Postman lo requiere)**
```json
{
  "command": "python",
  "args": [
    "C:/Test/AI/AI Learning with AI/backend/mcp_bridge_server.py"
  ]
}
```

### Paso 2: Ajustar la Ruta

**Reemplaza la ruta** `C:/Test/AI/AI Learning with AI/backend/mcp_bridge_server.py` con la ruta real de tu proyecto.

**Para encontrar tu ruta:**
1. Abre el explorador de archivos
2. Navega a tu proyecto
3. Ve a la carpeta `backend`
4. Copia la ruta completa del archivo `mcp_bridge_server.py`
5. Reemplaza las barras invertidas `\` con barras normales `/`

**Ejemplo:**
- Ruta en Windows: `C:\Test\AI\AI Learning with AI\backend\mcp_bridge_server.py`
- Ruta para Postman: `C:/Test/AI/AI Learning with AI/backend/mcp_bridge_server.py`

### Paso 3: Verificar Backend

Antes de conectar, asegúrate de que el backend esté corriendo:

```bash
# Abre PowerShell o CMD y ejecuta:
curl http://localhost:8000/api/mcp/manifest
```

Deberías ver un JSON con los servidores MCP disponibles.

### Paso 4: Conectar

1. Pega el comando en el campo "Enter command or paste JSON config"
2. Haz clic en el botón **"Connect"** (azul, a la derecha)
3. Espera a que Postman se conecte
4. Deberías ver las herramientas disponibles en la pestaña "Tools"

### Solución de Problemas

**Error: "python no se reconoce como comando"**
- Usa la ruta completa: `C:/Python39/python.exe` (ajusta la versión)
- O añade Python al PATH del sistema

**Error: "No se puede encontrar el archivo"**
- Verifica que la ruta sea correcta
- Usa barras normales `/` en lugar de `\`
- Asegúrate de que el archivo `mcp_bridge_server.py` existe

**Error: "Connection failed"**
- Verifica que el backend esté corriendo
- Prueba: `curl http://localhost:8000/api/mcp/manifest`
- Revisa la consola de Postman para más detalles

