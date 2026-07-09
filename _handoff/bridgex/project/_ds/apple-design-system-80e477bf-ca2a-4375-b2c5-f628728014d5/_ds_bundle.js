/* @ds-bundle: {"format":4,"namespace":"AppleDesignSystem_80e477","components":[{"name":"ConfiguratorChip","sourcePath":"components/cards/ConfiguratorChip.jsx"},{"name":"ProductTile","sourcePath":"components/cards/ProductTile.jsx"},{"name":"StoreCard","sourcePath":"components/cards/StoreCard.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"TextLink","sourcePath":"components/core/TextLink.jsx"},{"name":"SearchInput","sourcePath":"components/forms/SearchInput.jsx"},{"name":"Footer","sourcePath":"components/layout/Footer.jsx"},{"name":"GlobalNav","sourcePath":"components/navigation/GlobalNav.jsx"},{"name":"SubNav","sourcePath":"components/navigation/SubNav.jsx"}],"sourceHashes":{"components/cards/ConfiguratorChip.jsx":"c340d53afb6a","components/cards/ProductTile.jsx":"26adb396060f","components/cards/StoreCard.jsx":"b33641e4f9d4","components/core/Button.jsx":"6f0bbfba3efd","components/core/IconButton.jsx":"7a3933560f12","components/core/TextLink.jsx":"7c7f95847c3e","components/forms/SearchInput.jsx":"413e49e43c6e","components/layout/Footer.jsx":"b998b35a4608","components/navigation/GlobalNav.jsx":"40e9f6a5859c","components/navigation/SubNav.jsx":"666beaeb05b8"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AppleDesignSystem_80e477 = window.AppleDesignSystem_80e477 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/cards/ConfiguratorChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Pill-shaped configurator option cell (iPhone buy page). Thumbnail +
 * label + price delta. Selected state upgrades to a 2px focus-blue ring.
 */
function ConfiguratorChip({
  label = "256GB",
  sublabel,
  selected = false,
  onSelect,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onSelect,
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
    style: {
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 2,
      background: "var(--color-canvas)",
      color: "var(--color-ink)",
      border: selected ? "2px solid var(--color-primary-focus)" : "1px solid var(--color-hairline)",
      borderRadius: "var(--radius-pill)",
      padding: selected ? "11px 19px" : "12px 20px",
      cursor: "pointer",
      fontFamily: "var(--font-text)",
      textAlign: "left",
      transition: "transform var(--duration-press) var(--ease-standard)",
      transform: pressed ? "scale(var(--press-scale))" : "scale(1)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--type-body-strong-size)",
      letterSpacing: "var(--type-body-strong-track)",
      fontWeight: "var(--weight-semibold)"
    }
  }, label), sublabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--type-caption-size)",
      letterSpacing: "var(--type-caption-track)",
      color: "var(--color-ink-muted-48)"
    }
  }, sublabel));
}
Object.assign(__ds_scope, { ConfiguratorChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/ConfiguratorChip.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Apple's button family. One blue accent, two radius grammars.
 * variant: primary | secondary | dark-utility | pearl | store-hero
 * The system-wide press micro-interaction is scale(0.95).
 */
function Button({
  variant = "primary",
  children,
  disabled = false,
  href,
  onClick,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontFamily: "var(--font-text)",
    border: "none",
    cursor: disabled ? "default" : "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "transform var(--duration-press) var(--ease-standard)",
    transform: pressed && !disabled ? "scale(var(--press-scale))" : "scale(1)",
    outlineOffset: "2px"
  };
  const variants = {
    primary: {
      background: "var(--color-primary)",
      color: "#fff",
      borderRadius: "var(--radius-pill)",
      padding: "11px 22px",
      fontSize: "var(--type-body-size)",
      lineHeight: 1.2,
      letterSpacing: "var(--type-body-track)",
      fontWeight: "var(--weight-regular)"
    },
    secondary: {
      background: "transparent",
      color: "var(--color-primary)",
      border: "1px solid var(--color-primary)",
      borderRadius: "var(--radius-pill)",
      padding: "10px 21px",
      fontSize: "var(--type-body-size)",
      lineHeight: 1.2,
      letterSpacing: "var(--type-body-track)",
      fontWeight: "var(--weight-regular)"
    },
    "dark-utility": {
      background: "var(--color-ink)",
      color: "#fff",
      borderRadius: "var(--radius-sm)",
      padding: "8px 15px",
      fontSize: "var(--type-button-utility-size)",
      lineHeight: "var(--type-button-utility-line)",
      letterSpacing: "var(--type-button-utility-track)",
      fontWeight: "var(--weight-regular)"
    },
    pearl: {
      background: "var(--color-surface-pearl)",
      color: "var(--color-ink-muted-80)",
      border: "3px solid var(--color-divider-soft)",
      borderRadius: "var(--radius-md)",
      padding: "8px 14px",
      fontSize: "var(--type-caption-size)",
      lineHeight: "var(--type-caption-line)",
      letterSpacing: "var(--type-caption-track)",
      fontWeight: "var(--weight-regular)"
    },
    "store-hero": {
      background: "var(--color-primary)",
      color: "#fff",
      borderRadius: "var(--radius-pill)",
      padding: "14px 28px",
      fontSize: "var(--type-button-large-size)",
      lineHeight: "var(--type-button-large-line)",
      letterSpacing: "var(--type-button-large-track)",
      fontWeight: "var(--weight-light)"
    }
  };
  const disabledStyle = disabled ? {
    background: "var(--color-divider-soft)",
    color: "var(--color-ink-muted-48)",
    border: "none",
    cursor: "default"
  } : null;
  const composed = {
    ...base,
    ...variants[variant],
    ...disabledStyle,
    ...style
  };
  const handlers = disabled ? {} : {
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
    onTouchStart: () => setPressed(true),
    onTouchEnd: () => setPressed(false),
    onClick
  };
  if (href && !disabled) {
    return /*#__PURE__*/React.createElement("a", _extends({
      href: href,
      style: composed
    }, handlers, rest), children);
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    style: composed,
    disabled: disabled
  }, handlers, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/cards/ProductTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SURFACES = {
  light: {
    background: "var(--color-canvas)",
    color: "var(--color-ink)",
    dark: false
  },
  parchment: {
    background: "var(--color-canvas-parchment)",
    color: "var(--color-ink)",
    dark: false
  },
  dark: {
    background: "var(--color-surface-tile-1)",
    color: "#fff",
    dark: true
  },
  "dark-2": {
    background: "var(--color-surface-tile-2)",
    color: "#fff",
    dark: true
  },
  "dark-3": {
    background: "var(--color-surface-tile-3)",
    color: "#fff",
    dark: true
  }
};

/**
 * Full-bleed product tile — the homepage's core building block.
 * Centered stack: headline -> tagline -> two CTAs -> product render.
 * Surface alternates light/parchment/dark; the color change IS the divider.
 */
function ProductTile({
  surface = "light",
  eyebrow,
  headline = "iPhone",
  tagline = "Meet the new lineup.",
  primaryLabel = "Learn more",
  secondaryLabel = "Buy",
  imageSrc,
  imageAlt = "",
  compact = false,
  children,
  style,
  ...rest
}) {
  const s = SURFACES[surface] || SURFACES.light;
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: s.background,
      color: s.color,
      padding: `${compact ? 48 : 80}px 22px`,
      textAlign: "center",
      ...style
    }
  }, rest), eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--type-tagline-size)",
      letterSpacing: "var(--type-tagline-track)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--color-primary)",
      marginBottom: 8
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--type-display-lg-size)",
      lineHeight: "var(--type-display-lg-line)",
      letterSpacing: "var(--type-display-lg-track)",
      fontWeight: "var(--weight-semibold)",
      margin: 0
    }
  }, headline), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--type-lead-size)",
      lineHeight: "var(--type-lead-line)",
      letterSpacing: "var(--type-lead-track)",
      fontWeight: "var(--weight-regular)",
      margin: "8px 0 0",
      color: s.dark ? "var(--color-body-muted)" : "var(--color-ink)"
    }
  }, tagline), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 18,
      justifyContent: "center",
      marginTop: 22
    }
  }, primaryLabel && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary"
  }, primaryLabel), secondaryLabel && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary"
  }, secondaryLabel)), imageSrc && /*#__PURE__*/React.createElement("img", {
    src: imageSrc,
    alt: imageAlt,
    style: {
      display: "block",
      maxWidth: "100%",
      margin: "40px auto 0",
      filter: "drop-shadow(var(--shadow-product))"
    }
  }), children);
}
Object.assign(__ds_scope, { ProductTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/ProductTile.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Circular control chip that floats over photography (carousel arrows,
 * close, thumbnails). 44×44, translucent gray fill, ink glyph.
 * Presses to scale(0.95) like every button in the system.
 */
function IconButton({
  children,
  label = "button",
  size = 44,
  onClick,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const composed = {
    width: size,
    height: size,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--color-surface-chip-translucent)",
    color: "var(--color-ink)",
    border: "none",
    borderRadius: "var(--radius-full)",
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    transition: "transform var(--duration-press) var(--ease-standard)",
    transform: pressed ? "scale(var(--press-scale))" : "scale(1)",
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    style: composed,
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
    onClick: onClick
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/TextLink.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Inline body link in Action Blue. On dark tiles pass onDark to switch
 * to Sky Link Blue (Action Blue disappears against the dark surface).
 * A trailing chevron is the Apple "Learn more ›" convention.
 */
function TextLink({
  children,
  href = "#",
  onDark = false,
  chevron = false,
  style,
  ...rest
}) {
  const composed = {
    color: onDark ? "var(--color-primary-on-dark)" : "var(--color-primary)",
    fontFamily: "var(--font-text)",
    fontSize: "var(--type-body-size)",
    letterSpacing: "var(--type-body-track)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "2px",
    ...style
  };
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    style: composed
  }, rest), children, chevron && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: "0.85em",
      lineHeight: 1,
      transform: "translateY(0.5px)"
    }
  }, "\u203A"));
}
Object.assign(__ds_scope, { TextLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/TextLink.jsx", error: String((e && e.message) || e) }); }

// components/cards/StoreCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Store / accessories utility card. White, 1px hairline, 18px radius,
 * 24px padding. Product image (1:1, 8px inner radius) over name, price,
 * and a Buy/Learn-more text link. No card shadow — only the product gets one.
 */
function StoreCard({
  imageSrc,
  imageAlt = "",
  eyebrow,
  name = "AirPods Pro",
  price = "$249",
  linkLabel = "Buy",
  href = "#",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--color-canvas)",
      border: "1px solid var(--color-hairline)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-lg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      aspectRatio: "1 / 1",
      borderRadius: "var(--radius-sm)",
      background: "var(--color-canvas-parchment)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      marginBottom: 16
    }
  }, imageSrc && /*#__PURE__*/React.createElement("img", {
    src: imageSrc,
    alt: imageAlt,
    style: {
      maxWidth: "78%",
      maxHeight: "78%",
      filter: "drop-shadow(var(--shadow-product))"
    }
  })), eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-text)",
      fontSize: "var(--type-caption-strong-size)",
      letterSpacing: "var(--type-caption-strong-track)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--color-primary)",
      marginBottom: 2
    }
  }, eyebrow), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-text)",
      fontSize: "var(--type-body-strong-size)",
      letterSpacing: "var(--type-body-strong-track)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--color-ink)"
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-text)",
      fontSize: "var(--type-body-size)",
      letterSpacing: "var(--type-body-track)",
      color: "var(--color-ink)",
      marginTop: 2
    }
  }, price), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.TextLink, {
    href: href,
    chevron: true
  }, linkLabel)));
}
Object.assign(__ds_scope, { StoreCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/StoreCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Pill-shaped search input — matches the CTA radius grammar. Leading
 * search glyph, 44px tall, hairline border.
 */
function SearchInput({
  placeholder = "Search accessories",
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 44,
      padding: "0 20px",
      background: "var(--color-canvas)",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: "var(--radius-pill)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    fill: "none",
    stroke: "var(--color-ink-muted-48)",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16.5",
    y1: "16.5",
    x2: "21",
    y2: "21"
  })), /*#__PURE__*/React.createElement("input", _extends({
    type: "text",
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-text)",
      fontSize: "var(--type-body-size)",
      letterSpacing: "var(--type-body-track)",
      color: "var(--color-ink)"
    }
  }, rest)));
}
Object.assign(__ds_scope, { SearchInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchInput.jsx", error: String((e && e.message) || e) }); }

// components/layout/Footer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Parchment footer with dense link columns (the relaxed 2.41 leading is
 * what makes them scannable), bold column heads, and a legal fine-print row.
 */
function Footer({
  columns = [{
    heading: "Shop and Learn",
    links: ["Store", "Mac", "iPad", "iPhone", "Watch", "AirPods"]
  }, {
    heading: "Services",
    links: ["Apple Music", "Apple TV+", "Apple Arcade", "iCloud", "Apple One"]
  }, {
    heading: "Apple Store",
    links: ["Find a Store", "Genius Bar", "Today at Apple", "Apple Trade In"]
  }, {
    heading: "For Business",
    links: ["Apple and Business", "Shop for Business"]
  }, {
    heading: "About Apple",
    links: ["Newsroom", "Apple Leadership", "Career Opportunities", "Investors"]
  }],
  legal = "Copyright \u00A9 2026 Apple Inc. All rights reserved.",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("footer", _extends({
    style: {
      background: "var(--color-canvas-parchment)",
      color: "var(--color-ink-muted-80)",
      padding: "64px 22px",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 980,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: 32
    }
  }, columns.map(col => /*#__PURE__*/React.createElement("div", {
    key: col.heading
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-text)",
      fontSize: "var(--type-caption-strong-size)",
      letterSpacing: "var(--type-caption-strong-track)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--color-ink)",
      marginBottom: 4
    }
  }, col.heading), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: 0,
      padding: 0
    }
  }, col.links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l,
    style: {
      fontFamily: "var(--font-text)",
      fontSize: "var(--type-fine-print-size)",
      lineHeight: 2.2,
      color: "var(--color-ink-muted-80)"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: "inherit",
      textDecoration: "none"
    }
  }, l))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 980,
      margin: "32px auto 0",
      paddingTop: 16,
      borderTop: "1px solid var(--color-hairline)",
      fontFamily: "var(--font-text)",
      fontSize: "var(--type-fine-print-size)",
      letterSpacing: "var(--type-fine-print-track)",
      color: "var(--color-ink-muted-48)"
    }
  }, legal));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/GlobalNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * The persistent ultra-thin black nav bar pinned to the top of every page.
 * 44px tall, true black, quiet 12px links. Right cluster: search + bag.
 */
function GlobalNav({
  items = ["Store", "Mac", "iPad", "iPhone", "Watch", "AirPods", "TV & Home", "Entertainment", "Accessories", "Support"],
  logoSrc,
  style,
  ...rest
}) {
  const link = {
    color: "var(--color-body-on-dark)",
    opacity: 0.92,
    fontFamily: "var(--font-text)",
    fontSize: "var(--type-nav-link-size)",
    letterSpacing: "var(--type-nav-link-track)",
    textDecoration: "none",
    cursor: "pointer"
  };
  const iconBtn = {
    background: "none",
    border: "none",
    color: "var(--color-body-on-dark)",
    opacity: 0.92,
    padding: 0,
    cursor: "pointer",
    display: "inline-flex"
  };
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      height: 44,
      background: "var(--color-surface-black)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 980,
      padding: "0 22px",
      display: "flex",
      alignItems: "center",
      gap: 0,
      justifyContent: "space-between"
    }
  }, logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "Apple",
    style: {
      height: 14,
      color: "#fff",
      filter: "invert(1)"
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontSize: 16
    }
  }, "\uF8FF"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 28,
      flex: 1,
      justifyContent: "center"
    }
  }, items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it,
    href: "#",
    style: link
  }, it))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: iconBtn,
    "aria-label": "Search"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "15",
    height: "15",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16.5",
    y1: "16.5",
    x2: "21",
    y2: "21"
  }))), /*#__PURE__*/React.createElement("button", {
    style: iconBtn,
    "aria-label": "Bag"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "15",
    height: "15",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 8h12l-1 12H7L6 8z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 8V6a3 3 0 0 1 6 0v2"
  }))))));
}
Object.assign(__ds_scope, { GlobalNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/GlobalNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SubNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Surface-specific frosted nav that sticks below the global nav. 52px,
 * parchment @ 80% + backdrop blur. Left: category name (21px tagline).
 * Right: inline links ending in a persistent primary CTA.
 */
function SubNav({
  category = "iPhone",
  links = ["Overview", "Switch from Android", "Tech Specs"],
  ctaLabel = "Buy",
  onCta,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      height: 52,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 22px",
      background: "var(--frosted-bg)",
      backdropFilter: "var(--blur-frosted)",
      WebkitBackdropFilter: "var(--blur-frosted)",
      borderBottom: "1px solid rgba(0,0,0,0.08)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--type-tagline-size)",
      letterSpacing: "var(--type-tagline-track)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--color-ink)"
    }
  }, category), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 26
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontFamily: "var(--font-text)",
      fontSize: "var(--type-button-utility-size)",
      letterSpacing: "var(--type-button-utility-track)",
      color: "var(--color-ink)",
      opacity: 0.84,
      textDecoration: "none"
    }
  }, l)), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    onClick: onCta,
    style: {
      padding: "5px 16px",
      fontSize: 14
    }
  }, ctaLabel)));
}
Object.assign(__ds_scope, { SubNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SubNav.jsx", error: String((e && e.message) || e) }); }

__ds_ns.ConfiguratorChip = __ds_scope.ConfiguratorChip;

__ds_ns.ProductTile = __ds_scope.ProductTile;

__ds_ns.StoreCard = __ds_scope.StoreCard;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.TextLink = __ds_scope.TextLink;

__ds_ns.SearchInput = __ds_scope.SearchInput;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.GlobalNav = __ds_scope.GlobalNav;

__ds_ns.SubNav = __ds_scope.SubNav;

})();
