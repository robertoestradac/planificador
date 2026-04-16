export default function TextSection({ props }) {
  const {
    content,
    textAlign,
    fontSize,
    textColor,
    paddingY,
  } = props;

  return (
    <div
      style={{
        padding: `${paddingY || '40px'} 20px`,
      }}
    >
      <div
        style={{
          textAlign: textAlign || 'left',
          fontSize: fontSize || '16px',
          color: textColor || '#333',
          lineHeight: '1.6',
          maxWidth: '800px',
          margin: '0 auto',
          whiteSpace: 'pre-wrap',
        }}
      >
        {content || 'Escribe tu texto aquí...'}
      </div>
    </div>
  );
}
