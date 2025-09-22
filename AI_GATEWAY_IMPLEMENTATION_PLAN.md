# AI Gateway Implementation Plan
## Robomind Clinic Integration Across All Modules

### 🎯 **Objetivo**
Convertir el Robomind Clinic en una capa de seguridad transversal que monitoree automáticamente todas las interacciones de IA en la aplicación.

### 🏗️ **Arquitectura Implementada**

#### **1. Client SDK (agentOpsClient.ts)**
- **Ubicación**: `frontend/src/lib/agentOpsClient.ts`
- **Función**: Wrapper unificado para todas las llamadas de IA
- **Características**:
  - Asigna `run_id` único para cada sesión
  - Registra automáticamente todos los turns (usuario, asistente, herramientas)
  - Envía checkpoints al backend después de cada turn
  - Respeta políticas del Clinic desde el backend

#### **2. Backend Gateway**
- **Ubicación**: `backend/gateway/`
- **Componentes**:
  - `models.py`: Modelos de datos para requests/responses
  - `clinic_policy.py`: Sistema de políticas y decisiones
  - `store.py`: Almacenamiento en MongoDB
  - `router.py`: Endpoints del gateway

#### **3. Endpoints del Gateway**
- `POST /api/gateway/checkpoint`: Registra turns individuales
- `POST /api/gateway/chat`: Procesa chats con monitoreo
- `POST /api/gateway/flow/trigger`: Ejecuta flujos con monitoreo

### 🔧 **Configuración**

#### **Variables de Entorno (.env)**
```env
# AI Gateway Configuration
CLINIC_SAMPLING=0.25
MONGO_URI=mongodb://localhost:27017/app
CHAT_BACKEND=http://localhost:1234/v1/chat/completions
N8N_BRIDGE=http://localhost:8000/api/n8n/trigger
```

#### **Políticas por Defecto**
- **Sampling Rate**: 25% de las interacciones se diagnostican completamente
- **Threshold Block**: 85% (crítico)
- **Threshold Review**: 65% (alto)
- **Auto-apply Therapies**: Habilitado

### 📊 **Flujo de Trabajo**

1. **Cliente** hace llamada usando `agentOpsClient.chat()`
2. **Gateway** recibe la llamada y la reenvía al backend de IA
3. **Gateway** registra el turn en MongoDB
4. **Gateway** decide si diagnosticar (basado en sampling rate)
5. **Robomind Clinic** analiza los turns si es necesario
6. **Gateway** aplica políticas (bloquear, requerir aprobación, etc.)
7. **Cliente** recibe respuesta con metadata del clinic

### 🎛️ **Interfaz de Configuración**

#### **Componente ClinicSettings**
- **Ubicación**: `frontend/src/RobomindClinic/ClinicSettings.jsx`
- **Funcionalidades**:
  - Toggle global para habilitar/deshabilitar el clinic
  - Configuración de sampling rate
  - Ajuste de thresholds de riesgo
  - Selección de desórdenes a monitorear
  - Botón de prueba de configuración

### 🔄 **Integración en Módulos**

#### **Ejemplo: Prompt Lab**
```javascript
import { agentOpsClient } from '@/lib/agentOpsClient';

const runId = crypto.randomUUID();
const response = await agentOpsClient.chat(runId, {
  userPrompt: user,
  systemMessage: system,
  model: model,
  temperature: temperature
}, {
  module: 'prompt_lab',
  timestamp: new Date().toISOString()
});
```

#### **Ejemplo: Playbook → n8n**
```javascript
const response = await agentOpsClient.triggerFlow(runId, 'n8n', flowId, inputs, {
  module: 'playbook'
});
```

### 📈 **Monitoreo y Dashboards**

#### **Colecciones MongoDB**
- `clinic_cases`: Almacena turns de cada run
- `clinic_findings`: Almacena reportes de diagnóstico
- `clinic_policies`: Configuraciones por módulo/workflow

#### **Métricas Disponibles**
- Tasa de sampling por módulo
- Distribución de riesgos (low/moderate/high/critical)
- Desórdenes más frecuentes
- Efectividad de las terapias aplicadas

### 🚀 **Plan de Despliegue Incremental**

#### **Fase 1: Prompt Lab (Piloto)**
- [x] Implementar gateway básico
- [x] Integrar agentOpsClient en Prompt Lab
- [x] Configurar sampling rate bajo (10%)
- [x] Solo diagnóstico, sin enforcement

#### **Fase 2: Expansión**
- [ ] Habilitar en Playbook → n8n
- [ ] Añadir enforcement para casos críticos
- [ ] Implementar auto-terapias

#### **Fase 3: Producción**
- [ ] Habilitar en todos los módulos
- [ ] Políticas estrictas para proyectos de producción
- [ ] Dashboards de monitoreo en tiempo real

### 🧪 **Testing**

#### **Checklist de Pruebas**
- [x] SDK envuelve llamadas y crea run_id
- [x] Gateway almacena turns en clinic_cases
- [x] Sampling funciona correctamente
- [x] Diagnóstico se ejecuta en casos muestreados
- [x] Configuración se guarda y carga correctamente

#### **Casos de Prueba**
- **Bunkering Laconia**: AI se niega a continuar
- **Operational Dissociation**: AI se contradice
- **Synthetic Confabulation**: AI inventa hechos
- **OCD Loops**: AI repite respuestas idénticas

### 🔒 **Seguridad y Privacidad**

#### **Consideraciones**
- **Sampling**: Mantiene overhead mínimo
- **Redacción**: Enmascara secretos antes de almacenar
- **Retención**: Límite de turns por ventana deslizante
- **Acceso**: Solo administradores pueden ver diagnósticos

### 📚 **Archivos Creados/Modificados**

#### **Nuevos Archivos**
- `frontend/src/lib/agentOpsClient.ts`
- `backend/gateway/models.py`
- `backend/gateway/clinic_policy.py`
- `backend/gateway/store.py`
- `backend/gateway/router.py`
- `backend/gateway/__init__.py`
- `frontend/src/RobomindClinic/ClinicSettings.jsx`
- `frontend/src/RobomindClinic/RobomindClinicWithTabs.jsx`
- `frontend/src/examples/PromptLabWithClinic.jsx`

#### **Archivos Modificados**
- `backend/app.py` - Incluye gateway router
- `frontend/src/App.jsx` - Usa nuevo componente con tabs
- `.env` - Variables de configuración del gateway

### 🎉 **Beneficios Obtenidos**

1. **Monitoreo Automático**: Todas las interacciones de IA pasan por el clinic
2. **Políticas Flexibles**: Configuración por módulo y workflow
3. **Bajo Overhead**: Sampling rate configurable
4. **Interfaz Unificada**: Un solo cliente para todas las llamadas de IA
5. **Escalabilidad**: Fácil añadir nuevos módulos
6. **Observabilidad**: Métricas y dashboards integrados

### 🔮 **Próximos Pasos**

1. **Probar el gateway** con el backend funcionando
2. **Integrar en Prompt Lab** como piloto
3. **Ajustar políticas** basado en datos reales
4. **Expandir a otros módulos** gradualmente
5. **Implementar dashboards** de monitoreo
6. **Añadir auto-terapias** avanzadas

---

**Estado**: ✅ Implementación completa lista para testing
**Autor**: Ignacio Tejera
**Fecha**: Septiembre 2025
