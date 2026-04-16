export const DEFAULT_STATS = [
  { value: '10,000+', label: 'Eventos creados' },
  { value: '500,000+', label: 'Invitados gestionados' },
  { value: '98%', label: 'Satisfacción' },
  { value: '50+', label: 'Plantillas' },
];

export const DEFAULT_STEPS = [
  {
    id: 's1', icon: 'Palette', title: 'Elige tu plantilla',
    description: 'Selecciona entre más de 50 plantillas profesionales o empieza desde cero con nuestro editor visual drag & drop.'
  },
  {
    id: 's2', icon: 'Wand2', title: 'Personaliza todo',
    description: 'Agrega música, fotos, itinerario, mapa interactivo y formulario de RSVP. Sin código, sin complicaciones.'
  },
  {
    id: 's3', icon: 'Share2', title: 'Comparte y gestiona',
    description: 'Envía el enlace por WhatsApp o redes sociales. Recibe confirmaciones en tiempo real desde tu panel.'
  },
];

export const DEFAULT_FEATURES = [
  { id: 'builder',   icon: 'Palette',      title: 'Builder Visual Drag & Drop',  description: 'Diseña sin código. Arrastra y suelta bloques para crear la invitación perfecta. Textos, imágenes, música y más.', visible: true },
  { id: 'rsvp',      icon: 'CheckCircle',  title: 'Gestión de RSVP',             description: 'Control total sobre quién asiste. Acompañantes, menús especiales y restricciones alimenticias en un solo lugar.', visible: true },
  { id: 'analytics', icon: 'BarChart3',    title: 'Analíticas en Tiempo Real',   description: 'Descubre quién abrió tu invitación, desde qué dispositivo y en qué momento. Datos que te ayudan a tomar decisiones.', visible: true },
  { id: 'mobile',    icon: 'Smartphone',   title: 'Diseño 100% Responsive',      description: 'Tus invitaciones se verán perfectas en celulares, tablets y computadoras. Optimizadas para cada pantalla.', visible: true },
  { id: 'planner',   icon: 'Calendar',     title: 'Planificador de Eventos',     description: 'Gestiona tareas, presupuesto, proveedores y cronograma desde un solo panel. Todo lo que necesitas para tu evento.', visible: true },
  { id: 'photos',    icon: 'Camera',       title: 'Galería de Fotos',            description: 'Tus invitados pueden subir fotos del evento directamente desde la invitación. Crea recuerdos compartidos.', visible: true },
];

export const DEFAULT_FAQ = [
  { id: 'f1', question: '¿Los invitados necesitan instalar alguna app?', answer: 'No. Tus invitados solo hacen clic en el enlace y ven la invitación en cualquier navegador web, ya sea en celular, tablet o computadora. Sin descargas, sin registros.' },
  { id: 'f2', question: '¿Puedo gestionar las confirmaciones de asistencia (RSVP)?', answer: '¡Sí! Todas las confirmaciones, incluyendo acompañantes y restricciones alimenticias, llegan directo a tu panel de control en tiempo real. También puedes exportar la lista de invitados.' },
  { id: 'f3', question: '¿Puedo agregar música a mi invitación?', answer: 'Absolutamente. Puedes agregar música de fondo que se reproduce automáticamente cuando el invitado abre la invitación, creando una experiencia inmersiva y memorable.' },
  { id: 'f4', question: '¿Cuánto tiempo tarda en estar lista mi invitación?', answer: 'Con nuestras plantillas prediseñadas, puedes tener tu invitación lista en menos de 10 minutos. Solo selecciona una plantilla, personaliza el texto y comparte el enlace.' },
  { id: 'f5', question: '¿Puedo cambiar el diseño después de publicar?', answer: 'Sí, puedes editar tu invitación en cualquier momento, incluso después de haberla compartido. Los cambios se reflejan instantáneamente para todos los que tengan el enlace.' },
];

export const DEFAULT_LANDING = {
  hero: {
    badge:          '✨ La plataforma #1 de invitaciones digitales',
    title:          'Invitaciones digitales',
    titleHighlight: 'que enamoran',
    description:    'Crea, personaliza y comparte invitaciones digitales impresionantes en minutos. Con RSVP integrado, analíticas en tiempo real y un builder visual sin código.',
    ctaPrimary:     'Crear mi invitación gratis',
    ctaSecondary:   'Ver demo',
    ctaNote:        'Sin tarjeta de crédito · Listo en minutos',
    bgImage:        '',
    visible:        true,
  },
  slideshow: {
    visible:  false,
    autoplay: true,
    interval: 4500,
    images:   [],
    caption:  '',
  },
  features: {
    title:    'Todo lo que necesitas para tu evento',
    subtitle: 'Herramientas de nivel profesional diseñadas para ser increíblemente fáciles de usar.',
    visible:  true,
    items:    DEFAULT_FEATURES,
  },
  stats: {
    visible: true,
    items:   DEFAULT_STATS,
  },
  steps: {
    title:    'Crea tu invitación en 3 pasos',
    subtitle: 'Un proceso diseñado para ser rápido, intuitivo y divertido.',
    visible:  true,
    items:    DEFAULT_STEPS,
  },
  gallery: {
    title:    'Inspiración sin límites',
    subtitle: 'Descubre invitaciones reales creadas con nuestra plataforma.',
    visible:  true,
    images:   [],
  },
  faq: {
    title:    'Preguntas Frecuentes',
    subtitle: 'Todo lo que necesitas saber antes de empezar.',
    visible:  true,
    items:    DEFAULT_FAQ,
  },
  cta: {
    title:       '¿Listo para crear tu primera invitación?',
    description: 'Únete a miles de organizadores que ya confían en nuestra plataforma para sus eventos más especiales.',
    ctaText:     'Comenzar gratis ahora',
    bgColor:     '#7c3aed',
    visible:     true,
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} InvitApp. Todos los derechos reservados.`,
    visible:   true,
  },
};

export function mergeLanding(stored) {
  if (!stored) return DEFAULT_LANDING;
  return {
    hero:      { ...DEFAULT_LANDING.hero,      ...(stored.hero      || {}) },
    slideshow: { ...DEFAULT_LANDING.slideshow, ...(stored.slideshow || {}) },
    features: {
      ...DEFAULT_LANDING.features,
      ...(stored.features || {}),
      items: stored.features?.items ?? DEFAULT_LANDING.features.items,
    },
    stats: {
      ...DEFAULT_LANDING.stats,
      ...(stored.stats || {}),
      items: stored.stats?.items ?? DEFAULT_LANDING.stats.items,
    },
    steps: {
      ...DEFAULT_LANDING.steps,
      ...(stored.steps || {}),
      items: stored.steps?.items ?? DEFAULT_LANDING.steps.items,
    },
    gallery: {
      ...DEFAULT_LANDING.gallery,
      ...(stored.gallery || {}),
      images: stored.gallery?.images ?? DEFAULT_LANDING.gallery.images,
    },
    faq: {
      ...DEFAULT_LANDING.faq,
      ...(stored.faq || {}),
      items: stored.faq?.items ?? DEFAULT_LANDING.faq.items,
    },
    cta:    { ...DEFAULT_LANDING.cta,    ...(stored.cta    || {}) },
    footer: { ...DEFAULT_LANDING.footer, ...(stored.footer || {}) },
  };
}
