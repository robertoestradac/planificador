import { THEMES } from './themes';

// Helper to generate specific props based on section type and theme style
const getPropsForType = (type, categoryId, style) => {
  const baseColors = style.colors;
  
  switch (type) {
    case 'hero':
      return {
        title: getTitleForCategory(categoryId, style.name),
        subtitle: getSubtitleForCategory(categoryId),
        backgroundColor: baseColors.background,
        textColor: baseColors.text,
        textAlign: 'center',
        paddingY: '100px',
        backgroundImage: '', // Images would typically be separate or placeholders
      };
      
    case 'text':
      return {
        backgroundColor: baseColors.background,
        textColor: baseColors.text,
        content: getTextContentForCategory(categoryId),
        textAlign: 'center',
        paddingY: '60px',
        fontSize: '18px',
      };
      
    case 'countdown':
      return {
        backgroundColor: baseColors.background,
        textColor: baseColors.text,
        title: 'Faltan',
        paddingY: '50px',
        // Some specific countdown overrides if needed
      };
      
    case 'rsvp':
      return {
        backgroundColor: baseColors.background, // If wrapper supports it, otherwise global bg
        title: 'Confirma tu asistencia',
        buttonText: 'Confirmar',
        buttonColor: baseColors.accent,
        buttonTextColor: '#ffffff', // Usually white text on accent button looks best, or adjust
        textAlign: 'center',
        paddingY: '60px',
      };
      
    case 'divider':
      return {
        color: baseColors.accent,
        thickness: '2px',
        paddingY: '30px',
        style: 'solid',
      };

    case 'music_player':
      return {
        backgroundColor: baseColors.background,
        textColor: baseColors.text,
        paddingY: '20px',
        title: 'Nuestra Canción',
      };

    case 'image':
      return {
        borderRadius: '8px',
        paddingY: '40px',
        width: '100%',
        objectFit: 'cover',
        // Placeholder or empty src
        src: '', 
      };

    case 'gallery':
      return {
        columns: 3,
        gap: '10px',
        borderRadius: '8px',
        paddingY: '40px',
        images: [], 
      };

    case 'map':
      return {
        title: 'Nuestra Ubicación',
        height: '400px',
        paddingY: '40px',
        // Default Google Maps embed
        embedUrl: '',
      };
      
    default:
      return {};
  }
};

const getTitleForCategory = (category, styleName) => {
  switch (category) {
    case 'boda': return 'Nuestra Boda';
    case 'quince': return 'Mis XV Años';
    case 'cumpleanos': return '¡Feliz Cumpleaños!';
    case 'babyshower': return 'Baby Shower';
    case 'graduacion': return 'Graduación 2025';
    case 'corporativo': return 'Evento Corporativo';
    default: return 'Título';
  }
};

const getSubtitleForCategory = (category) => {
  switch (category) {
    case 'boda': return 'Acompáñanos en este día especial';
    case 'quince': return 'Una noche de ensueño';
    case 'cumpleanos': return 'Celebra conmigo';
    case 'babyshower': return 'Esperando al bebé';
    case 'graduacion': return 'Un logro para celebrar';
    case 'corporativo': return 'Innovación y Futuro';
    default: return 'Subtítulo';
  }
};

const getTextContentForCategory = (category) => {
  return `Texto de ejemplo para ${category}. Aquí puedes describir los detalles de tu evento con el estilo seleccionado.`;
};

// Generate templates for a specific section type
export const getTemplatesForSection = (sectionType) => {
  const templates = {};
  
  Object.values(THEMES).forEach(theme => {
    templates[theme.id] = {
      category: theme.label,
      icon: theme.icon,
      templates: theme.styles.map(style => ({
        id: `${sectionType}-${theme.id}-${style.id}`,
        name: style.name,
        thumbnail: style.thumbnail,
        props: getPropsForType(sectionType, theme.id, style)
      }))
    };
  });
  
  return Object.values(templates);
};
