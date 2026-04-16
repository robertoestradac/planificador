'use client';
import { useState, useEffect } from 'react';
import {
  Save, Loader2, Monitor, Eye, EyeOff, ChevronDown, ChevronUp,
  Image as ImageIcon, Type, Layout, Zap, AlignLeft, Trash2, Plus, Grid, ListOrdered, MessageCircleQuestion
} from 'lucide-react';
import useSettingsStore from '@/store/settingsStore';
import ImageUpload from '@/app/dashboard/builder/[id]/components/ImageUpload';
import { mergeLanding, DEFAULT_LANDING } from '@/lib/defaultLanding';
import { toast } from '@/hooks/use-toast';

/* ── helpers ── */
function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-violet-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline }) {
  const cls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none bg-gray-50';
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {multiline
        ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
        : <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value || '#7c3aed'} onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-1" />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#7c3aed"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 outline-none bg-gray-50 font-mono" />
      </div>
    </div>
  );
}

function SectionCard({ title, icon, visible, onToggleVisible, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
        <span className="text-violet-500">{icon}</span>
        <span className="flex-1 text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</span>
        <button
          type="button"
          onClick={() => onToggleVisible(!visible)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${visible ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
        >
          {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {visible ? 'Visible' : 'Oculto'}
        </button>
        <button type="button" onClick={() => setOpen(o => !o)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

export default function AdminLandingPage() {
  const { settings, fetch, update, loaded } = useSettingsStore();
  const [lc,     setLc]     = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    if (loaded && !lc) {
      setLc(mergeLanding(settings.landing_content));
    }
  }, [loaded, settings]);

  const set = (section, key, val) =>
    setLc(prev => ({ ...prev, [section]: { ...prev[section], [key]: val } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({ landing_content: lc });
      toast({ title: 'Landing page guardada', description: 'Los cambios ya son visibles en el sitio.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const openPreview = () => window.open('/', '_blank');

  if (!lc) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  /* ── General array helpers ── */
  const updateArrayItem = (section, i, key, val) =>
    setLc(prev => ({ ...prev, [section]: { ...prev[section], items: prev[section].items.map((item, idx) => idx === i ? { ...item, [key]: val } : item) } }));

  const removeArrayItem = (section, i) =>
    setLc(prev => ({ ...prev, [section]: { ...prev[section], items: prev[section].items.filter((_, idx) => idx !== i) } }));

  const addArrayItem = (section, defaultItem) =>
    setLc(prev => ({ ...prev, [section]: { ...prev[section], items: [...(prev[section].items || []), defaultItem] } }));

  /* ── Slideshow & Gallery images helpers ── */
  const addImage = (section, url) => {
    if (!url) return;
    setLc(prev => ({ ...prev, [section]: { ...prev[section], images: [...(prev[section].images || []), url] } }));
  };

  const removeImage = (section, i) =>
    setLc(prev => ({ ...prev, [section]: { ...prev[section], images: prev[section].images.filter((_, idx) => idx !== i) } }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
          <Monitor className="w-6 h-6 text-violet-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Editor de Landing Page</h1>
          <p className="text-sm text-gray-500">Edita las secciones del sitio público</p>
        </div>
        <button
          onClick={openPreview}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver sitio
        </button>
      </div>

      {/* ── HERO ── */}
      <SectionCard title="Hero" icon={<Layout className="w-4 h-4" />} visible={lc.hero.visible !== false} onToggleVisible={v => set('hero', 'visible', v)} defaultOpen>
        <TextField label="Badge" value={lc.hero.badge} onChange={v => set('hero', 'badge', v)} placeholder="Plataforma de invitaciones digitales" />
        <TextField label="Título principal" value={lc.hero.title} onChange={v => set('hero', 'title', v)} placeholder="Crea invitaciones digitales" />
        <TextField label="Palabra destacada (color)" value={lc.hero.titleHighlight} onChange={v => set('hero', 'titleHighlight', v)} placeholder="impresionantes" />
        <TextField label="Descripción" value={lc.hero.description} onChange={v => set('hero', 'description', v)} multiline placeholder="Descripción del hero..." />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Botón primario" value={lc.hero.ctaPrimary} onChange={v => set('hero', 'ctaPrimary', v)} placeholder="Empezar ahora" />
          <TextField label="Botón secundario" value={lc.hero.ctaSecondary} onChange={v => set('hero', 'ctaSecondary', v)} placeholder="Ver demo" />
        </div>
        <TextField label="Nota debajo de botones" value={lc.hero.ctaNote} onChange={v => set('hero', 'ctaNote', v)} placeholder="Sin tarjeta de crédito requerida" />
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Imagen de fondo</label>
          <ImageUpload value={lc.hero.bgImage} onChange={url => set('hero', 'bgImage', url || '')} />
        </div>
      </SectionCard>

      {/* ── SLIDESHOW ── */}
      <SectionCard title="Slideshow / Galería" icon={<ImageIcon className="w-4 h-4" />} visible={lc.slideshow.visible} onToggleVisible={v => set('slideshow', 'visible', v)}>
        <TextField label="Texto / Caption" value={lc.slideshow.caption} onChange={v => set('slideshow', 'caption', v)} placeholder="Mira nuestras invitaciones..." />
        <div className="grid grid-cols-2 gap-3">
          <Toggle label="Autoplay" value={lc.slideshow.autoplay} onChange={v => set('slideshow', 'autoplay', v)} />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Intervalo (ms)</label>
            <input type="number" min={1000} max={10000} step={500}
              value={lc.slideshow.interval || 4000}
              onChange={e => set('slideshow', 'interval', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none bg-gray-50" />
          </div>
        </div>

        {/* Image list */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Imágenes en el celular ({(lc.slideshow.images || []).length})
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(lc.slideshow.images || []).map((url, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden aspect-[9/19.5] bg-gray-100">
                <img src={url} alt={`slide ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage('slideshow', i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <ImageUpload value="" onChange={url => { if (url) addImage('slideshow', url); }} label="Agregar imagen" />
        </div>
      </SectionCard>

      {/* ── STEPS ── */}
      <SectionCard title="Pasos (Cómo funciona)" icon={<ListOrdered className="w-4 h-4" />} visible={lc.steps.visible !== false} onToggleVisible={v => set('steps', 'visible', v)}>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Título" value={lc.steps.title} onChange={v => set('steps', 'title', v)} />
          <TextField label="Subtítulo" value={lc.steps.subtitle} onChange={v => set('steps', 'subtitle', v)} />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pasos configurados</span>
            <button type="button" onClick={() => addArrayItem('steps', { id: `s-${Date.now()}`, icon: 'Sparkles', title: 'Nuevo paso', description: '' })}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl border border-violet-200 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
          {(lc.steps.items || []).map((item, i) => (
            <div key={item.id || i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Paso #{i + 1}</span>
                <button type="button" onClick={() => removeArrayItem('steps', i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Título" value={item.title} onChange={v => updateArrayItem('steps', i, 'title', v)} />
                <TextField label="Icono (Lucide)" value={item.icon} onChange={v => updateArrayItem('steps', i, 'icon', v)} />
              </div>
              <TextField label="Descripción" value={item.description} onChange={v => updateArrayItem('steps', i, 'description', v)} multiline />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── FEATURES ── */}
      <SectionCard title="Características (Bento Grid)" icon={<Zap className="w-4 h-4" />} visible={lc.features.visible !== false} onToggleVisible={v => set('features', 'visible', v)}>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Título de sección" value={lc.features.title} onChange={v => set('features', 'title', v)} />
          <TextField label="Subtítulo" value={lc.features.subtitle} onChange={v => set('features', 'subtitle', v)} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarjetas de características</span>
            <button type="button" onClick={() => addArrayItem('features', { id: `item-${Date.now()}`, icon: 'Sparkles', title: 'Nueva característica', description: '', visible: true })}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl border border-violet-200 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>

          {(lc.features.items || []).map((item, i) => (
            <div key={item.id || i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Tarjeta #{i + 1}</span>
                <div className="flex items-center gap-2">
                  <Toggle label="Visible" value={item.visible !== false} onChange={v => updateArrayItem('features', i, 'visible', v)} />
                  <button type="button" onClick={() => removeArrayItem('features', i)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Título" value={item.title} onChange={v => updateArrayItem('features', i, 'title', v)} />
                <TextField label="Icono (Lucide)" value={item.icon} onChange={v => updateArrayItem('features', i, 'icon', v)} />
              </div>
              <TextField label="Descripción" value={item.description} onChange={v => updateArrayItem('features', i, 'description', v)} multiline />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── GALLERY ── */}
      <SectionCard title="Galería (Ejemplos)" icon={<Grid className="w-4 h-4" />} visible={lc.gallery.visible !== false} onToggleVisible={v => set('gallery', 'visible', v)}>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Título" value={lc.gallery.title} onChange={v => set('gallery', 'title', v)} />
          <TextField label="Subtítulo" value={lc.gallery.subtitle} onChange={v => set('gallery', 'subtitle', v)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Imágenes ({(lc.gallery.images || []).length})
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(lc.gallery.images || []).map((url, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden aspect-[4/5] bg-gray-100">
                <img src={url} alt={`gallery ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage('gallery', i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <ImageUpload value="" onChange={url => { if (url) addImage('gallery', url); }} label="Agregar imagen a galería" />
        </div>
      </SectionCard>

      {/* ── FAQ ── */}
      <SectionCard title="Preguntas Frecuentes" icon={<MessageCircleQuestion className="w-4 h-4" />} visible={lc.faq.visible !== false} onToggleVisible={v => set('faq', 'visible', v)}>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Título" value={lc.faq.title} onChange={v => set('faq', 'title', v)} />
          <TextField label="Subtítulo" value={lc.faq.subtitle} onChange={v => set('faq', 'subtitle', v)} />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preguntas</span>
            <button type="button" onClick={() => addArrayItem('faq', { id: `f-${Date.now()}`, question: 'Nueva pregunta', answer: 'Respuesta...' })}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl border border-violet-200 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
          {(lc.faq.items || []).map((item, i) => (
            <div key={item.id || i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Q#{i + 1}</span>
                <button type="button" onClick={() => removeArrayItem('faq', i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <TextField label="Pregunta" value={item.question} onChange={v => updateArrayItem('faq', i, 'question', v)} />
              <TextField label="Respuesta" value={item.answer} onChange={v => updateArrayItem('faq', i, 'answer', v)} multiline />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── CTA ── */}
      <SectionCard title="Banner CTA" icon={<Type className="w-4 h-4" />} visible={lc.cta.visible !== false} onToggleVisible={v => set('cta', 'visible', v)}>
        <TextField label="Título" value={lc.cta.title} onChange={v => set('cta', 'title', v)} />
        <TextField label="Descripción" value={lc.cta.description} onChange={v => set('cta', 'description', v)} multiline />
        <TextField label="Texto del botón" value={lc.cta.ctaText} onChange={v => set('cta', 'ctaText', v)} />
        <ColorField label="Color de fondo" value={lc.cta.bgColor} onChange={v => set('cta', 'bgColor', v)} />
      </SectionCard>

      {/* ── FOOTER ── */}
      <SectionCard title="Footer" icon={<AlignLeft className="w-4 h-4" />} visible={lc.footer.visible !== false} onToggleVisible={v => set('footer', 'visible', v)}>
        <TextField label="Texto de copyright" value={lc.footer.copyright} onChange={v => set('footer', 'copyright', v)} placeholder={`© ${new Date().getFullYear()} InvitApp. Todos los derechos reservados.`} />
      </SectionCard>

      {/* Save button */}
      <div className="sticky bottom-0 pb-1 pt-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 disabled:opacity-50 rounded-2xl shadow-lg transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
