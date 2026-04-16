const SHAPES = {
  circle:   'circle(50% at 50% 50%)',
  ellipse:  'ellipse(50% 40% at 50% 50%)',
  diamond:  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  triangle: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  hexagon:  'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  star:     'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  arrow_up: 'polygon(50% 0%, 100% 100%, 50% 75%, 0% 100%)',
  cross:    'polygon(33% 0%,67% 0%,67% 33%,100% 33%,100% 67%,67% 67%,67% 100%,33% 100%,33% 67%,0% 67%,0% 33%,33% 33%)',
};

export const SHAPE_LABELS = {
  circle: 'Círculo', ellipse: 'Elipse', diamond: 'Diamante',
  triangle: 'Triángulo', hexagon: 'Hexágono', pentagon: 'Pentágono',
  star: 'Estrella', arrow_up: 'Flecha', cross: 'Cruz',
};

export default function MaskSection({ props }) {
  const {
    mode       = 'image',
    shape      = 'circle',
    image      = '',
    text       = 'Texto enmascarado',
    textColor  = '#ffffff',
    fontSize   = '32px',
    fontWeight = '700',
    bgColor    = '#ec4899',
    width      = '280px',
    height     = '280px',
    textAlign  = 'center',
    paddingY   = '40px',
  } = props;

  const clipPath = SHAPES[shape] || SHAPES.circle;

  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: `${paddingY} 20px`,
  };

  const maskStyle = {
    width,
    height,
    clipPath,
    WebkitClipPath: clipPath,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    backgroundColor: bgColor,
  };

  return (
    <div style={containerStyle}>
      <div style={maskStyle}>
        {mode === 'image' && image ? (
          <img
            src={image}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
              padding: '16px',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                fontSize,
                fontWeight,
                color: textColor,
                textAlign,
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              {text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
