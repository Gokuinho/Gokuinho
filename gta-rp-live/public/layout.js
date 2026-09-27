/*
 * Géométrie de l'overlay (toile verticale TikTok 1080 × 1920). Le mode
 * « calage » affiche ces zones pour placer la capture du jeu et la webcam
 * dans TikTok LIVE Studio pile sous les cadres de l'overlay.
 */
(function (root, factory) {
  const layout = factory();
  if (typeof module === 'object' && module.exports) module.exports = layout;
  else root.LIVE_LAYOUT = layout;
})(typeof self !== 'undefined' ? self : this, function () {
  const CANVAS = { width: 1080, height: 1920 };

  // Zones recouvertes par l'interface de l'appli TikTok côté spectateur
  // (avatar + viewers en haut, commentaires + boutons en bas). On n'y met
  // jamais d'info importante.
  const TIKTOK_UI = {
    top: { x: 0, y: 0, width: 1080, height: 220 },
    bottom: { x: 0, y: 1380, width: 1080, height: 540 },
    right: { x: 960, y: 1100, width: 120, height: 820 },
  };

  const LAYOUTS = {
    // Jeu en 16:9 plein largeur, webcam + fiche perso dessous.
    classic: {
      game: { x: 0, y: 230, width: 1080, height: 608 },
      webcam: { x: 24, y: 858, width: 420, height: 420 },
      card: { x: 464, y: 858, width: 592, height: 420 },
      cardNoCam: { x: 24, y: 858, width: 1032, height: 420 },
      ticker: { x: 24, y: 1296, width: 1032, height: 64 },
      alert: { x: 90, y: 330, width: 900, height: 300 },
    },
    // Jeu recadré en plein écran vertical (immersif), infos compactes en haut.
    full: {
      game: { x: 0, y: 0, width: 1080, height: 1920 },
      webcam: { x: 736, y: 236, width: 320, height: 320 },
      card: { x: 24, y: 236, width: 692, height: 320 },
      cardNoCam: { x: 24, y: 236, width: 1032, height: 320 },
      ticker: { x: 24, y: 1296, width: 1032, height: 64 },
      alert: { x: 90, y: 640, width: 900, height: 300 },
    },
  };

  return { CANVAS, TIKTOK_UI, LAYOUTS };
});
