export type { OverlayTheme, OverlayAppearance } from './overlayAppearance.mjs';
export {
    OVERLAY_OPACITY_MIN,
    OVERLAY_OPACITY_MAX,
    OVERLAY_OPACITY_DEFAULT,
    OVERLAY_OPACITY_DEFAULT_DARK,
    OVERLAY_OPACITY_DEFAULT_LIGHT,
    OVERLAY_OPACITY_LEGACY_DEFAULTS,
    getDefaultOverlayOpacity,
    clampOverlayOpacity,
    isStoredOverlayOpacityUserSet,
    resolveStoredOverlayOpacity,
    migrateStoredOverlayOpacity,
    getOverlayAppearance,
    getGlassOverlayAppearance,
} from './overlayAppearance.mjs';
