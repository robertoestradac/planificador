import HeroSection        from './HeroSection';
import TextSection        from './TextSection';
import ImageSection       from './ImageSection';
import CountdownSection   from './CountdownSection';
import GallerySection     from './GallerySection';
import MapSection         from './MapSection';
import RSVPSection        from './RSVPSection';
import MusicPlayerSection from './MusicPlayerSection';
import DividerSection     from './DividerSection';
import VideoSection       from './VideoSection';
import CoupleSection      from './CoupleSection';
import ScheduleSection    from './ScheduleSection';
import DressCodeSection   from './DressCodeSection';
import GiftsSection       from './GiftsSection';
import QuoteSection       from './QuoteSection';
import HospedajeSection   from './HospedajeSection';
import MenuEventSection      from './MenuEventSection';
import PhotoUploadSection    from './PhotoUploadSection';
import MaskSection           from './MaskSection';

export const SECTION_COMPONENTS = {
  hero:         HeroSection,
  text:         TextSection,
  image:        ImageSection,
  countdown:    CountdownSection,
  gallery:      GallerySection,
  map:          MapSection,
  rsvp:         RSVPSection,
  music_player: MusicPlayerSection,
  divider:      DividerSection,
  video:        VideoSection,
  couple:       CoupleSection,
  schedule:     ScheduleSection,
  dress_code:   DressCodeSection,
  gifts:        GiftsSection,
  quote:        QuoteSection,
  hospedaje:    HospedajeSection,
  menu_event:     MenuEventSection,
  photo_upload:   PhotoUploadSection,
  mask:            MaskSection,
};

export const getSectionComponent = (type) => SECTION_COMPONENTS[type] || null;
