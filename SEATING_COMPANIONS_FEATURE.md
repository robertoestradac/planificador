# 🪑 Funcionalidad de Asignación de Mesas con Acompañantes

## 📋 Resumen

Se ha implementado una funcionalidad completa para gestionar invitados con acompañantes en el sistema de asignación de mesas del planificador. Ahora cuando un invitado tiene múltiples personas en su grupo (`party_size > 1`), el sistema puede asignar automáticamente a todos los acompañantes en la misma mesa o en mesas diferentes.

## ✨ Características Implementadas

### 1. **Visualización de Party Size**
- ✅ Los invitados con acompañantes muestran un badge con el número de personas
- ✅ Icono de usuarios para indicar grupos
- ✅ Información visible en el selector de invitados

### 2. **Asignación Automática de Acompañantes**
- ✅ Al asignar un invitado principal, el sistema detecta su `party_size`
- ✅ Verifica si hay asientos disponibles en la mesa
- ✅ Asigna automáticamente a los acompañantes en asientos libres
- ✅ Muestra notificaciones informativas sobre el proceso

### 3. **Validaciones Inteligentes**
- ✅ Alerta si no hay suficientes asientos para todo el grupo
- ✅ Permite asignar solo al invitado principal si no hay espacio
- ✅ Previene asignaciones duplicadas del invitado principal
- ✅ Permite múltiples acompañantes del mismo invitado

### 4. **Visualización Mejorada en Canvas**
- ✅ Invitados principales: círculo sólido con iniciales
- ✅ Acompañantes: círculo con borde punteado y "+1", "+2", etc.
- ✅ Tooltips informativos mostrando relación con invitado principal
- ✅ Colores según estado de confirmación

### 5. **Lista de Invitados Mejorada**
- ✅ Acompañantes mostrados con indentación (↳)
- ✅ Estilo diferenciado (itálica, gris)
- ✅ Indicador visual de acompañante en el punto de color

## 🗄️ Cambios en Base de Datos

### Tabla: `plan_seat_assignments`

Se agregaron dos nuevas columnas:

```sql
ALTER TABLE plan_seat_assignments
ADD COLUMN is_companion TINYINT(1) DEFAULT 0,
ADD COLUMN companion_index INT DEFAULT NULL;
```

**Campos:**
- `is_companion`: Indica si la asignación es de un acompañante (0 = invitado principal, 1 = acompañante)
- `companion_index`: Número del acompañante (1, 2, 3, etc.)

## 📁 Archivos Modificados

### Backend

1. **`backend/src/modules/planner/planner.model.js`**
   - ✅ Actualizado `getSeatingTables()` para incluir `is_companion`, `companion_index` y `party_size`
   - ✅ Actualizado `assignSeat()` para soportar parámetros de acompañantes

2. **`backend/src/modules/planner/planner.service.js`**
   - ✅ Actualizado `assignSeat()` para recibir y validar acompañantes
   - ✅ Modificada validación para permitir múltiples asignaciones del mismo invitado como acompañantes

3. **`backend/src/modules/planner/planner.controller.js`**
   - ✅ Actualizado `assignSeat()` para extraer y pasar parámetros de acompañantes

4. **`backend/src/database/migrations/add_companion_fields_to_seat_assignments.js`**
   - ✅ Nueva migración para agregar columnas de acompañantes
   - ✅ Incluye función `up()` y `down()` para reversibilidad

5. **`backend/run-companion-migration.js`**
   - ✅ Script para ejecutar la migración

### Frontend

6. **`frontend/src/app/dashboard/planner/[planId]/SeatingTab.jsx`**
   - ✅ Actualizado selector de invitados para mostrar `party_size`
   - ✅ Implementada lógica de asignación automática de acompañantes
   - ✅ Mejorada visualización en canvas con bordes punteados
   - ✅ Actualizado componente `AccordionTable` para mostrar acompañantes
   - ✅ Tooltips mejorados con información de grupo

## 🎯 Flujo de Uso

### Escenario 1: Invitado con Acompañantes - Asignación Exitosa

1. Usuario hace clic en un asiento libre
2. Selecciona un invitado que tiene `party_size = 3` (invitado + 2 acompañantes)
3. Sistema verifica que hay 3 asientos libres en la mesa
4. Asigna automáticamente:
   - Asiento 1: Invitado principal (Juan Pérez)
   - Asiento 2: Acompañante 1 (+1)
   - Asiento 3: Acompañante 2 (+2)
5. Muestra toast de éxito: "Se asignó a Juan Pérez + 2 acompañante(s)"

### Escenario 2: Invitado con Acompañantes - Espacio Insuficiente

1. Usuario hace clic en un asiento libre
2. Selecciona un invitado que tiene `party_size = 4`
3. La mesa solo tiene 2 asientos libres
4. Sistema muestra alerta: "Este invitado necesita 4 asientos pero solo hay 2 disponibles"
5. Pregunta si desea asignar solo al invitado principal
6. Si acepta: asigna solo al invitado principal
7. Si cancela: no hace ninguna asignación

### Escenario 3: Invitado Individual

1. Usuario hace clic en un asiento libre
2. Selecciona un invitado que tiene `party_size = 1`
3. Sistema asigna solo al invitado principal
4. Muestra toast simple: "Invitado asignado"

## 🎨 Elementos Visuales

### Canvas de Mesas

**Invitado Principal:**
```
┌─────────┐
│   JP    │  ← Círculo sólido con iniciales
└─────────┘
```

**Acompañante:**
```
┌ ─ ─ ─ ─ ┐
│   +1    │  ← Círculo con borde punteado
└ ─ ─ ─ ─ ┘
```

### Lista de Invitados

```
Mesa 1                    3/8
├─ Juan Pérez            ● (verde)
├─ ↳ Acompañante 1       ⊙ (verde, punteado)
└─ ↳ Acompañante 2       ⊙ (verde, punteado)
```

### Selector de Invitados

```
┌──────────────────────────────────┐
│ Juan Pérez                    👥3│
│ Familia García                   │
└──────────────────────────────────┘
```

## 🔧 API Endpoints

### Asignar Asiento

**Endpoint:** `POST /planner/:planId/seating/tables/:tableId/seats/:seatId/assign`

**Body:**
```json
{
  "guest_id": "uuid-del-invitado",
  "is_companion": false,      // opcional, default: false
  "companion_index": null     // opcional, default: null
}
```

**Ejemplo - Invitado Principal:**
```json
{
  "guest_id": "abc-123"
}
```

**Ejemplo - Acompañante:**
```json
{
  "guest_id": "abc-123",
  "is_companion": true,
  "companion_index": 1
}
```

## 📊 Estructura de Datos

### Guest Object (con party_size)
```javascript
{
  id: "abc-123",
  name: "Juan Pérez",
  party_size: 3,           // Total de personas en el grupo
  group_name: "Familia Pérez",
  // ... otros campos
}
```

### Seat Assignment Object
```javascript
{
  id: "seat-assignment-id",
  guest_id: "abc-123",
  guest_name: "Juan Pérez",
  party_size: 3,
  is_companion: false,      // true si es acompañante
  companion_index: null,    // 1, 2, 3... si es acompañante
  rsvp_status: "confirmed"
}
```

## 🧪 Casos de Prueba

### Test 1: Asignación de Grupo Completo
- ✅ Invitado con party_size = 4
- ✅ Mesa con 8 asientos libres
- ✅ Resultado: 4 asientos asignados (1 principal + 3 acompañantes)

### Test 2: Asignación Parcial
- ✅ Invitado con party_size = 5
- ✅ Mesa con 2 asientos libres
- ✅ Resultado: Usuario decide si asigna solo principal

### Test 3: Invitado Individual
- ✅ Invitado con party_size = 1
- ✅ Mesa con asientos libres
- ✅ Resultado: 1 asiento asignado

### Test 4: Validación de Duplicados
- ✅ Invitado ya asignado como principal
- ✅ Intento de asignar nuevamente como principal
- ✅ Resultado: Error 409 - "Guest is already assigned"

### Test 5: Acompañantes en Diferentes Mesas
- ✅ Invitado principal en Mesa 1
- ✅ Acompañantes pueden asignarse en Mesa 2
- ✅ Resultado: Permitido (flexibilidad para el usuario)

## 💡 Mejoras Futuras (Opcionales)

1. **Asignación Inteligente Multi-Mesa**
   - Sugerir automáticamente mesas cercanas si no hay espacio
   - Algoritmo para optimizar distribución de grupos grandes

2. **Gestión de Nombres de Acompañantes**
   - Permitir ingresar nombres específicos para cada acompañante
   - Mostrar nombres reales en lugar de "+1", "+2"

3. **Restricciones de Grupo**
   - Opción para forzar que todo el grupo esté en la misma mesa
   - Alertas si se separa un grupo

4. **Reportes Mejorados**
   - PDF con desglose de invitados principales y acompañantes
   - Estadísticas de ocupación por grupos

5. **Drag & Drop de Grupos**
   - Arrastrar un invitado principal mueve a todos sus acompañantes
   - Opción para mover solo el principal

## 🚀 Comandos de Despliegue

### Ejecutar Migración en Producción

```bash
cd backend
node run-companion-migration.js
```

### Verificar Migración

```sql
DESCRIBE plan_seat_assignments;
-- Debe mostrar las columnas: is_companion, companion_index
```

### Rollback (si es necesario)

```javascript
// Ejecutar la función down() de la migración
const migration = require('./src/database/migrations/add_companion_fields_to_seat_assignments');
await migration.down();
```

## ✅ Checklist de Implementación

- [x] Migración de base de datos creada y ejecutada
- [x] Modelo actualizado para incluir campos de acompañantes
- [x] Servicio actualizado con lógica de validación
- [x] Controlador actualizado para recibir parámetros
- [x] Frontend: Visualización de party_size en selector
- [x] Frontend: Lógica de asignación automática
- [x] Frontend: Visualización diferenciada en canvas
- [x] Frontend: Lista de invitados con acompañantes
- [x] Frontend: Tooltips informativos
- [x] Frontend: Notificaciones mejoradas
- [x] Documentación completa

## 📝 Notas Importantes

1. **Compatibilidad hacia atrás**: Las asignaciones existentes sin acompañantes siguen funcionando normalmente (is_companion = 0 por defecto)

2. **Flexibilidad**: El sistema permite asignar acompañantes en mesas diferentes si el usuario lo desea

3. **Validación**: Solo el invitado principal no puede estar duplicado; los acompañantes pueden asignarse múltiples veces

4. **UX**: El sistema siempre pregunta al usuario antes de hacer asignaciones parciales

---

**Implementado por:** Kiro AI Assistant
**Fecha:** 2026-05-02
**Versión:** 1.0.0
