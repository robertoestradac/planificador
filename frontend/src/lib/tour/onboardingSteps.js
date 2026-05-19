/**
 * Steps del tour de bienvenida del tenant.
 *
 * Flujo:
 *   Dashboard -> Eventos -> "Nuevo evento" -> nombre -> fecha -> ubicacion -> "Crear"
 *   -> Invitaciones -> "Nueva invitacion" -> titulo -> seleccionar evento -> "Crear"
 *   -> Builder
 *
 * Selectors usan atributos `data-tour="..."` para evitar acoplarse a clases CSS.
 *
 * Campos extra (custom, no nativos de NextStepjs):
 *   requireField: selector de input que debe estar lleno antes de poder avanzar.
 */

export const ONBOARDING_TOUR = [
  {
    tour: 'main-tour',
    steps: [
      // 0. Bienvenida (modal central en /dashboard)
      {
        icon: null,
        title: 'Bienvenido a InvitApp',
        content:
          'Te guiaremos en pocos pasos para crear tu primera invitacion. ' +
          'Tomara menos de 2 minutos.',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 0,
        pointerRadius: 0,
      },

      // 1. Ir a "Eventos"
      {
        icon: null,
        title: 'Paso 1: Ir a eventos',
        content:
          'Primero crearemos un evento. Haz clic en "Eventos" en el menu lateral.',
        selector: '[data-tour="nav-events"]',
        side: 'right',
        showControls: true,
        nextRoute: '/dashboard/events',
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 2. Boton "Nuevo evento"
      {
        icon: null,
        title: 'Crea tu primer evento',
        content: 'Haz clic en "Nuevo Evento" para abrir el formulario.',
        selector: '[data-tour="create-event-btn"]',
        side: 'left',
        showControls: true,
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 3. Nombre del evento
      {
        icon: null,
        title: 'Nombre del evento',
        content:
          'Ponle un nombre. Por ejemplo: "Boda de Ana y Carlos".',
        selector: '[data-tour="event-name-input"]',
        requireField: '[data-tour="event-name-input"]',
        side: 'bottom',
        showControls: true,
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 4. Fecha del evento
      {
        icon: null,
        title: 'Fecha y hora',
        content: 'Elige cuando sera el evento.',
        selector: '[data-tour="event-date-input"]',
        requireField: '[data-tour="event-date-input"]',
        side: 'bottom',
        showControls: true,
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 5. Ubicacion
      {
        icon: null,
        title: 'Ubicacion',
        content:
          'Escribe el lugar donde se realizara el evento. ' +
          'Es importante para que tus invitados sepan a donde ir.',
        selector: '[data-tour="event-location-input"]',
        requireField: '[data-tour="event-location-input"]',
        side: 'bottom',
        showControls: true,
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 6. Boton "Crear" del evento
      {
        icon: null,
        title: 'Guarda el evento',
        content:
          'Pulsa "Crear" para guardar el evento. Luego seguimos con la invitacion.',
        selector: '[data-tour="event-submit-btn"]',
        side: 'top',
        showControls: true,
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 7. Ir a "Invitaciones"
      {
        icon: null,
        title: 'Paso 2: Crea la invitacion',
        content:
          'Con el evento listo, ahora vamos a crear la invitacion digital. ' +
          'Haz clic en "Invitaciones" en el menu.',
        selector: '[data-tour="nav-invitations"]',
        side: 'right',
        showControls: true,
        nextRoute: '/dashboard/invitations',
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 8. Boton "Nueva invitacion"
      {
        icon: null,
        title: 'Abre el formulario',
        content: 'Haz clic en "Nueva Invitacion" para abrir el formulario.',
        selector: '[data-tour="create-invitation-btn"]',
        side: 'left',
        showControls: true,
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 9. Titulo de la invitacion
      {
        icon: null,
        title: 'Ponle un titulo',
        content:
          'Dale un titulo a tu invitacion. Por ejemplo: ' +
          '"Invitacion a la boda de Ana y Carlos".',
        selector: '[data-tour="invitation-title-input"]',
        requireField: '[data-tour="invitation-title-input"]',
        side: 'top',
        showControls: true,
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 10. Seleccionar evento
      {
        icon: null,
        title: 'Selecciona el evento',
        content: 'Vincula la invitacion al evento que creaste antes.',
        selector: '[data-tour="invitation-event-select"]',
        requireField: '[data-tour="invitation-event-select"]',
        side: 'top',
        showControls: true,
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 11. Boton "Crear invitacion"
      {
        icon: null,
        title: 'Crea la invitacion',
        content:
          'Pulsa "Crear invitacion". Aparecera en la lista lista para disenar.',
        selector: '[data-tour="invitation-submit-btn"]',
        side: 'top',
        showControls: true,
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 12. Boton Builder
      {
        icon: null,
        title: 'Paso 3: Disena tu invitacion',
        content:
          'Pasa el cursor sobre cualquier invitacion de la lista y pulsa ' +
          '"Builder" para abrir el editor visual.',
        selector: '[data-tour="invitation-builder-btn"]',
        side: 'top',
        showControls: true,
        pointerPadding: 6,
        pointerRadius: 8,
      },

      // 13. Cierre
      {
        icon: null,
        title: 'Listo!',
        content:
          'Ya conoces el flujo principal. Si necesitas repasarlo, ' +
          'usa "Ver tutorial" desde el menu de tu perfil.',
        side: 'bottom',
        showControls: true,
        pointerPadding: 0,
        pointerRadius: 0,
      },
    ],
  },
];
