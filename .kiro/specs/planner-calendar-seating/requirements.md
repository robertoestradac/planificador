# Documento de Requisitos

## Introducción

Este documento describe los requisitos para dos nuevos módulos del planificador de eventos (`/dashboard/planner/[planId]`) en el SaaS multi-tenant de invitaciones digitales:

1. **Módulo de Calendario con Alertas y Notas**: Un calendario visual integrado en el planificador donde el usuario puede agregar notas y alertas en fechas específicas. Las alertas se notifican visualmente en el dashboard.

2. **Módulo de Mesas (Seating Chart)**: Un canvas interactivo con drag & drop para organizar mesas numeradas, configurar sillas por mesa, asignar invitados a asientos y visualizar el estado de ocupación según el RSVP de cada invitado.

Ambos módulos se integran como nuevas pestañas en el planificador existente, respetando la arquitectura multi-tenant (Node.js + Express + MySQL en backend, Next.js + Tailwind CSS en frontend).

---

## Glosario

- **Planner**: El planificador de eventos existente en `/dashboard/planner/[planId]`, identificado por un `event_plan` en la base de datos.
- **Plan**: Registro en la tabla `event_plans`, asociado a un evento y un tenant.
- **Calendar_Module**: El nuevo módulo de calendario con alertas y notas dentro del Planner.
- **Calendar_Entry**: Un registro que representa una nota o alerta asociada a una fecha específica dentro de un Plan.
- **Alert**: Un tipo de Calendar_Entry que activa una notificación visual en el dashboard cuando su fecha es igual o anterior a la fecha actual.
- **Note**: Un tipo de Calendar_Entry de tipo informativo, sin notificación activa.
- **Seating_Module**: El nuevo módulo de distribución de mesas (seating chart) dentro del Planner.
- **Table**: Una mesa dentro del Seating_Module, con número único, posición en el canvas y número de sillas configurado.
- **Bride_Table**: Una mesa especial de novios dentro del Seating_Module, con identificación visual diferenciada.
- **Seat**: Un asiento individual dentro de una Table, con posición calculada automáticamente.
- **Seat_Assignment**: La asignación de un Guest a un Seat específico.
- **Guest**: Un invitado registrado en la tabla `guests`, asociado a una invitación del mismo evento.
- **RSVP**: La respuesta de confirmación de asistencia de un Guest (confirmed, declined, maybe, pending).
- **Seat_Status**: El estado visual de un Seat: `occupied` (RSVP confirmed), `pending` (RSVP pending o maybe), `free` (RSVP declined o sin asignación).
- **Canvas**: El área de trabajo visual del Seating_Module donde se posicionan las mesas mediante drag & drop.
- **Tenant**: La organización propietaria del Plan, identificada por `tenant_id`.
- **Dashboard**: La interfaz principal del tenant en `/dashboard`.

---

## Requisitos

### Requisito 1: Pestaña de Calendario en el Planificador

**User Story:** Como organizador de eventos, quiero ver un calendario visual dentro del planificador, para tener una vista temporal de todas mis notas y alertas relacionadas al evento.

#### Criterios de Aceptación

1. THE Planner SHALL mostrar una pestaña llamada "Calendario" junto a las pestañas existentes (Checklist, Presupuesto, Proveedores, Cronograma).
2. WHEN el usuario selecciona la pestaña "Calendario", THE Calendar_Module SHALL renderizar un calendario mensual visual con navegación entre meses.
3. WHEN el Calendar_Module carga, THE Calendar_Module SHALL obtener todas las Calendar_Entries del Plan actual desde el backend y mostrarlas en sus fechas correspondientes.
4. WHEN una fecha tiene Calendar_Entries asociadas, THE Calendar_Module SHALL mostrar un indicador visual (punto o badge) sobre esa fecha en el calendario.

---

### Requisito 2: Creación y Gestión de Notas en el Calendario

**User Story:** Como organizador de eventos, quiero agregar notas en fechas específicas del calendario, para registrar recordatorios e información relevante del evento.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en una fecha del calendario, THE Calendar_Module SHALL mostrar un panel lateral o modal con las Calendar_Entries de esa fecha y un formulario para agregar nuevas entradas.
2. WHEN el usuario completa el formulario con título, tipo (nota o alerta) y descripción opcional, y confirma, THE Calendar_Module SHALL enviar la Calendar_Entry al backend y mostrarla en el calendario sin recargar la página.
3. THE Calendar_Module SHALL permitir al usuario editar el título y descripción de una Calendar_Entry existente.
4. WHEN el usuario confirma la eliminación de una Calendar_Entry, THE Calendar_Module SHALL eliminarla del backend y removerla del calendario.
5. IF el título de la Calendar_Entry está vacío al confirmar, THEN THE Calendar_Module SHALL mostrar un mensaje de error de validación y no enviar la solicitud al backend.

---

### Requisito 3: Alertas Visuales en el Dashboard

**User Story:** Como organizador de eventos, quiero recibir notificaciones visuales en el dashboard cuando una alerta del calendario llega a su fecha, para no olvidar tareas importantes del evento.

#### Criterios de Aceptación

1. WHEN el usuario accede al Dashboard y existen Calendar_Entries de tipo alerta cuya fecha es igual o anterior a la fecha actual y no han sido descartadas, THE Dashboard SHALL mostrar un indicador de alertas pendientes (badge con conteo) en la navegación o área visible del dashboard.
2. WHEN el usuario hace clic en el indicador de alertas, THE Dashboard SHALL mostrar un panel con la lista de alertas activas, incluyendo título, descripción y fecha de cada una.
3. WHEN el usuario descarta una alerta desde el panel, THE Dashboard SHALL marcar la alerta como descartada en el backend y removerla del panel sin recargar la página.
4. WHILE no existen alertas activas pendientes, THE Dashboard SHALL ocultar el indicador de alertas.
5. IF el backend retorna un error al obtener las alertas, THEN THE Dashboard SHALL omitir el indicador de alertas sin mostrar un error al usuario.

---

### Requisito 4: API de Calendario (Backend)

**User Story:** Como sistema, necesito endpoints REST para gestionar Calendar_Entries, para que el frontend pueda crear, leer, actualizar y eliminar notas y alertas del calendario.

#### Criterios de Aceptación

1. THE Backend SHALL exponer los endpoints `GET /planner/:planId/calendar`, `POST /planner/:planId/calendar`, `PUT /planner/:planId/calendar/:entryId` y `DELETE /planner/:planId/calendar/:entryId` bajo el middleware de autenticación y autorización `use_planner` existente.
2. WHEN se recibe `POST /planner/:planId/calendar` con `{ title, type, date, description }`, THE Backend SHALL crear una Calendar_Entry asociada al Plan y retornar el registro creado con status 201.
3. WHEN se recibe `GET /planner/:planId/calendar`, THE Backend SHALL retornar todas las Calendar_Entries del Plan ordenadas por fecha ascendente.
4. WHEN se recibe `GET /dashboard/alerts` con el tenant autenticado, THE Backend SHALL retornar todas las Calendar_Entries de tipo alerta cuya fecha es menor o igual a la fecha actual y `dismissed_at` es NULL, de todos los Planes del tenant.
5. WHEN se recibe `PUT /planner/:planId/calendar/:entryId` con `{ dismissed_at: <timestamp> }`, THE Backend SHALL actualizar el campo `dismissed_at` de la Calendar_Entry y retornar el registro actualizado.
6. IF el `planId` no pertenece al tenant autenticado, THEN THE Backend SHALL retornar un error 403.
7. IF el campo `title` está ausente o vacío en `POST /planner/:planId/calendar`, THEN THE Backend SHALL retornar un error 422 con descripción del campo inválido.
8. IF el campo `date` no es una fecha válida en formato ISO 8601, THEN THE Backend SHALL retornar un error 422 con descripción del campo inválido.

---

### Requisito 5: Pestaña de Mesas (Seating Chart) en el Planificador

**User Story:** Como organizador de eventos, quiero ver un módulo de distribución de mesas dentro del planificador, para planificar visualmente la ubicación de los invitados en el evento.

#### Criterios de Aceptación

1. THE Planner SHALL mostrar una pestaña llamada "Mesas" junto a las pestañas existentes.
2. WHEN el usuario selecciona la pestaña "Mesas", THE Seating_Module SHALL renderizar un Canvas con las mesas guardadas del Plan actual.
3. WHEN el Seating_Module carga, THE Seating_Module SHALL obtener todas las Tables y Seat_Assignments del Plan actual desde el backend.
4. WHEN no existen Tables en el Plan, THE Seating_Module SHALL mostrar el Canvas vacío con un mensaje indicando que no hay mesas y un botón para agregar la primera mesa.

---

### Requisito 6: Gestión de Mesas en el Canvas

**User Story:** Como organizador de eventos, quiero agregar, mover y eliminar mesas en el canvas, para diseñar la distribución del salón de mi evento.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en "Agregar mesa", THE Seating_Module SHALL crear una nueva Table con número autoincremental (el siguiente número disponible), posición inicial en el centro del Canvas visible, y el número de sillas configurado por defecto (4).
2. THE Seating_Module SHALL numerar las Tables de forma secuencial comenzando desde 1, asignando el número más bajo disponible al crear una nueva mesa.
3. WHEN el usuario arrastra una Table en el Canvas, THE Seating_Module SHALL actualizar la posición de la Table en tiempo real durante el arrastre y persistir la nueva posición en el backend al soltar.
4. WHEN el usuario hace clic en una Table, THE Seating_Module SHALL mostrar un panel de configuración con el número de sillas (editable, mínimo 1, máximo 20) y la opción de eliminar la mesa.
5. WHEN el usuario modifica el número de sillas de una Table y confirma, THE Seating_Module SHALL actualizar los Seats de la Table: agregar Seats si el número aumenta, eliminar los Seats sin asignación si el número disminuye, y mantener los Seats con Seat_Assignment activa.
6. WHEN el usuario confirma la eliminación de una Table, THE Seating_Module SHALL eliminar la Table y todos sus Seats del backend, liberando las Seat_Assignments asociadas, y remover la Table del Canvas.
7. THE Seating_Module SHALL renderizar los Seats de cada Table en posición circular alrededor de la Table, calculada automáticamente según el número de sillas.

---

### Requisito 7: Mesa Especial de Novios

**User Story:** Como organizador de eventos de boda, quiero tener una mesa especial de novios diferenciada visualmente, para identificarla fácilmente en el plano del salón.

#### Criterios de Aceptación

1. THE Seating_Module SHALL permitir al usuario agregar una Bride_Table mediante un botón o acción diferenciada de "Agregar mesa de novios".
2. THE Seating_Module SHALL renderizar la Bride_Table con un estilo visual diferente al de las Tables regulares (color, ícono o etiqueta distintiva).
3. THE Planner SHALL permitir únicamente una Bride_Table por Plan. WHEN ya existe una Bride_Table en el Plan, THE Seating_Module SHALL deshabilitar la opción de agregar otra Bride_Table.
4. THE Bride_Table SHALL seguir las mismas reglas de posicionamiento, configuración de sillas y asignación de invitados que una Table regular.

---

### Requisito 8: Asignación de Invitados a Asientos

**User Story:** Como organizador de eventos, quiero asignar invitados a asientos específicos en las mesas, para saber exactamente dónde se sentará cada persona.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en un Seat vacío, THE Seating_Module SHALL mostrar un selector con la lista de Guests del evento actual que no tienen Seat_Assignment activa.
2. WHEN el usuario selecciona un Guest del selector, THE Seating_Module SHALL crear una Seat_Assignment en el backend y actualizar el estado visual del Seat.
3. WHEN el usuario hace clic en un Seat con Seat_Assignment, THE Seating_Module SHALL mostrar el nombre del Guest asignado y la opción de remover la asignación.
4. WHEN el usuario confirma remover una Seat_Assignment, THE Seating_Module SHALL eliminar la Seat_Assignment del backend y marcar el Seat como libre.
5. THE Seating_Module SHALL mostrar el nombre del Guest asignado sobre o junto al Seat en el Canvas.
6. IF un Guest ya tiene una Seat_Assignment activa en el Plan, THEN THE Seating_Module SHALL excluirlo de la lista de Guests disponibles para asignar a otros Seats.

---

### Requisito 9: Estado Visual de los Asientos

**User Story:** Como organizador de eventos, quiero ver el estado de cada asiento según el RSVP del invitado asignado, para conocer de un vistazo cuántos lugares están confirmados, pendientes o libres.

#### Criterios de Aceptación

1. THE Seating_Module SHALL renderizar cada Seat con un color según su Seat_Status: verde para `occupied` (RSVP confirmed), amarillo/naranja para `pending` (RSVP pending o maybe), gris para `free` (sin asignación o RSVP declined).
2. WHEN el RSVP de un Guest cambia en el módulo de guests, THE Seating_Module SHALL reflejar el nuevo Seat_Status al recargar o refrescar el módulo de mesas.
3. THE Seating_Module SHALL mostrar un resumen de conteo de asientos por estado (ocupados, pendientes, libres, total) en la parte superior del Canvas.
4. THE Seating_Module SHALL mostrar el porcentaje de ocupación confirmada respecto al total de asientos con asignación.

---

### Requisito 10: API de Mesas (Backend)

**User Story:** Como sistema, necesito endpoints REST para gestionar Tables, Seats y Seat_Assignments, para que el frontend pueda crear, leer, actualizar y eliminar la distribución de mesas.

#### Criterios de Aceptación

1. THE Backend SHALL exponer endpoints CRUD bajo `/planner/:planId/seating/tables` y `/planner/:planId/seating/tables/:tableId/seats/:seatId/assign` bajo el middleware de autenticación y autorización `use_planner` existente.
2. WHEN se recibe `POST /planner/:planId/seating/tables` con `{ seat_count, is_bride_table, position_x, position_y }`, THE Backend SHALL crear una Table con número autoincremental, crear los Seats correspondientes y retornar la Table con sus Seats con status 201.
3. WHEN se recibe `GET /planner/:planId/seating/tables`, THE Backend SHALL retornar todas las Tables del Plan con sus Seats y Seat_Assignments, incluyendo el nombre del Guest asignado y su RSVP status.
4. WHEN se recibe `PUT /planner/:planId/seating/tables/:tableId` con `{ position_x, position_y }`, THE Backend SHALL actualizar la posición de la Table y retornar el registro actualizado.
5. WHEN se recibe `PUT /planner/:planId/seating/tables/:tableId` con `{ seat_count }`, THE Backend SHALL ajustar los Seats de la Table según las reglas del Requisito 6, criterio 5.
6. WHEN se recibe `POST /planner/:planId/seating/tables/:tableId/seats/:seatId/assign` con `{ guest_id }`, THE Backend SHALL crear o actualizar la Seat_Assignment y retornar el Seat actualizado con status 200.
7. WHEN se recibe `DELETE /planner/:planId/seating/tables/:tableId/seats/:seatId/assign`, THE Backend SHALL eliminar la Seat_Assignment del Seat y retornar el Seat actualizado.
8. IF el `guest_id` ya tiene una Seat_Assignment activa en otro Seat del mismo Plan, THEN THE Backend SHALL retornar un error 409 indicando que el invitado ya está asignado.
9. IF el `planId` no pertenece al tenant autenticado, THEN THE Backend SHALL retornar un error 403.
10. IF se intenta crear una segunda Bride_Table en un Plan que ya tiene una, THEN THE Backend SHALL retornar un error 409.
