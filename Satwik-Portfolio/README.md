# Satwik Nayak - Portfolio Website

Complete editable website source, updated with a full-screen layout and scroll-driven 3D effects. All code and assets are included.

## Open the website

1. Extract the ZIP file and open the Satwik-Portfolio folder.
2. Double-click index.html to view the website in your browser.

For development, open this folder in VS Code and use Live Server, or run
`python -m http.server 8000` from this folder and visit http://localhost:8000.
On Windows, you can use `py -m http.server 8000` instead.
No npm packages or build step are needed.

## Files and customization

- index.html: page text, sections, links, skills, education, and illustrations.
- styles.css: colors, typography, layouts, responsive styles, and animations.
- sculpture.js: interactive WebGL 3D sculpture and its fallback.
- app.js: project details, navigation, motion preferences, and copy-email button.
- immersive.css: full-width sections, viewport sizing, and 3D perspective styling.
- scroll-effects.js: scroll progress, card depth, chapter navigation, and 3D camera input.
- smooth3d.js / smooth3d.css: inertia smooth scrolling, round animated cursor, 3D card tilt, magnetic buttons, mouse-depth hero, 3D text reveals, and floating 3D shapes.
- assets/: fonts, font licenses, favicon, and your downloadable resume.

Change project dialog descriptions in the projects object in app.js.
Change the color theme using the variables at the top of styles.css.
Replace assets/Satwik-Nayak-Resume.pdf to update your resume.
If deploying elsewhere, update the og:url meta tag in index.html.

## Interactions

Scroll to rotate and zoom the 3D sculpture and move project cards through
perspective. The introduction stays on screen while the scroll scene plays.
Sections fill the available viewport and expand for longer content. Native
scrolling is preserved.

Drag the 3D sculpture to rotate it, or focus it with Tab and use arrow keys.
The fixed Pause motion button stops animation. System reduced-motion preferences
are respected. Click a project to view its details.

The project artwork is a labeled concept visualization, not a screenshot or
an accuracy/performance claim. Contact opens the visitor's email app; there
is no form server. GitHub and LinkedIn links lead to your profiles.

## Smooth + 3D extras (smooth3d.js)

- Smooth scrolling: wheel, keyboard and menu links glide with inertia. Touch phones keep native scrolling.
- Round cursor: a dot plus a trailing ring that stretches with speed, grows on links, and shows VIEW / DRAG on projects and the 3D knot. Desktop mouse only.
- Tuning: scroll smoothness is the `.1` in `1 - Math.pow(1 - .1, ...)` in the scroller (lower = floatier). Tilt strength is the `12` and `10` in the card `pointermove` handler. Edit the `cfg` list in `buildShapes` to move or remove the floating shapes.
- The Pause motion button and the system reduced-motion setting switch all of this off.

## Deploy

Upload the contents of this folder to a static website host. Preserve the
relative file locations. No external JavaScript dependencies or database
are required.
