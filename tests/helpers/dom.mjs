/* ============================================================
   Minimal DOM/browser stub for unit-testing the site's scripts.
   Only the surface the scripts actually touch is implemented:
   classList, dataset, attributes, a tiny simple-selector engine,
   event dispatch with bubbling, and rect/scroll hooks.
   ============================================================ */

const CAMEL = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const DASH = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

class ClassList {
  constructor(el) {
    this.el = el;
    this.set = new Set();
  }
  add(...names) { names.forEach((n) => this.set.add(n)); }
  remove(...names) { names.forEach((n) => this.set.delete(n)); }
  contains(name) { return this.set.has(name); }
  toggle(name, force) {
    const on = force === undefined ? !this.set.has(name) : force;
    if (on) this.set.add(name); else this.set.delete(name);
    return on;
  }
  get value() { return [...this.set].join(' '); }
}

export class FakeEvent {
  constructor(type, props = {}) {
    this.type = type;
    this.defaultPrevented = false;
    this.propagationStopped = false;
    Object.assign(this, props);
  }
  preventDefault() { this.defaultPrevented = true; }
  stopPropagation() { this.propagationStopped = true; }
}

/* --- selector engine: comma-separated lists of compound simple selectors --- */
const parseCompound = (source) => {
  const parts = { tag: null, id: null, classes: [], attrs: [] };
  const pattern = /([a-zA-Z][\w-]*)|#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:([~*^$|]?=)"?([^"\]]*)"?)?\]/g;
  let match;
  let consumed = 0;
  while ((match = pattern.exec(source))) {
    consumed += match[0].length;
    if (match[1]) parts.tag = match[1].toLowerCase();
    else if (match[2]) parts.id = match[2];
    else if (match[3]) parts.classes.push(match[3]);
    else parts.attrs.push({ name: match[4], op: match[5] || null, value: match[6] ?? '' });
  }
  if (consumed !== source.length) throw new Error(`unsupported selector: ${source}`);
  return parts;
};

const parseSelector = (selector) =>
  selector.split(',').map((part) => parseCompound(part.trim()));

const matchesCompound = (el, parts) => {
  if (parts.tag && el.tagName.toLowerCase() !== parts.tag) return false;
  if (parts.id && el.id !== parts.id) return false;
  if (parts.classes.some((cls) => !el.classList.contains(cls))) return false;
  return parts.attrs.every(({ name, op, value }) => {
    const actual = el.getAttribute(name);
    if (actual === null) return false;
    if (!op) return true;
    if (op === '=') return actual === value;
    if (op === '~=') return actual.split(/\s+/).includes(value);
    if (op === '^=') return actual.startsWith(value);
    if (op === '$=') return actual.endsWith(value);
    if (op === '*=') return actual.includes(value);
    return false;
  });
};

export class FakeElement {
  constructor(tagName = 'div', attrs = {}) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.ownerDocument = null;
    this.classList = new ClassList(this);
    this.attributes = new Map();
    this.listeners = new Map();
    this.rect = { top: 0, left: 0, width: 0, height: 0 };
    this.scrolls = [];
    this.clicks = 0;
    this.disabled = false;
    this.offsetParent = this;
    this.offsetWidth = 0;
    this.style = {};
    this.dataset = new Proxy({}, {
      get: (_, key) => this.attributes.get(`data-${DASH(String(key))}`),
      set: (_, key, value) => { this.attributes.set(`data-${DASH(String(key))}`, String(value)); return true; },
      has: (_, key) => this.attributes.has(`data-${DASH(String(key))}`),
      deleteProperty: (_, key) => this.attributes.delete(`data-${DASH(String(key))}`),
      ownKeys: () => [...this.attributes.keys()]
        .filter((k) => k.startsWith('data-'))
        .map((k) => CAMEL(k.slice(5))),
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    });

    for (const [name, value] of Object.entries(attrs)) {
      if (name === 'class') value.split(/\s+/).filter(Boolean).forEach((c) => this.classList.add(c));
      else this.setAttribute(name, String(value));
    }
  }

  get id() { return this.getAttribute('id') || ''; }
  get className() { return this.classList.value; }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) {
    if (name === 'class') return this.classList.value;
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }
  removeAttribute(name) { this.attributes.delete(name); }

  append(...nodes) {
    for (const node of nodes) {
      node.parentNode = this;
      node.ownerDocument = this.ownerDocument;
      this.children.push(node);
    }
    return nodes[nodes.length - 1];
  }
  appendChild(node) { return this.append(node); }

  get descendants() {
    return this.children.flatMap((child) => [child, ...child.descendants]);
  }

  matches(selector) {
    return parseSelector(selector).some((parts) => matchesCompound(this, parts));
  }
  querySelectorAll(selector) {
    const compounds = parseSelector(selector);
    return this.descendants.filter((el) => compounds.some((parts) => matchesCompound(el, parts)));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) {
    let node = this;
    while (node && node.matches) {
      if (node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  removeEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index >= 0) handlers.splice(index, 1);
  }
  dispatchEvent(event) {
    event.target = event.target || this;
    let node = this;
    while (node) {
      event.currentTarget = node;
      for (const handler of [...(node.listeners.get(event.type) || [])]) handler.call(node, event);
      if (event.propagationStopped) break;
      node = node.parentNode;
    }
    return !event.defaultPrevented;
  }

  getBoundingClientRect() {
    const { top, left, width, height } = this.rect;
    return { top, left, width, height, right: left + width, bottom: top + height };
  }
  setRect(rect) {
    this.rect = { ...this.rect, ...rect };
    return this;
  }
  scrollBy(options) { this.scrolls.push(options); }
  click() {
    this.clicks += 1;
    this.dispatchEvent(new FakeEvent('click'));
  }
  focus() { this.focused = true; }
}

export class FakeDocument extends FakeElement {
  constructor() {
    super('#document');
    this.ownerDocument = this;
    this.documentElement = new FakeElement('html');
    this.body = new FakeElement('body');
    this.append(this.documentElement);
    this.documentElement.append(this.body);
  }
  createElement(tagName) {
    const el = new FakeElement(tagName);
    el.ownerDocument = this;
    return el;
  }
  getElementById(id) { return this.querySelector(`[id="${id}"]`); }
}

/* Builds a document from a compact tree spec: { tag, attrs, rect, children } */
export function buildDocument(spec = []) {
  const doc = new FakeDocument();
  const build = (node) => {
    const el = new FakeElement(node.tag || 'div', node.attrs || {});
    el.ownerDocument = doc;
    if (node.rect) el.setRect(node.rect);
    (node.children || []).forEach((child) => el.append(build(child)));
    return el;
  };
  spec.forEach((node) => doc.body.append(build(node)));
  return doc;
}

export function createWindow(doc) {
  const win = {
    document: doc,
    opened: [],
    assigned: [],
    getComputedStyle: () => ({ position: 'static' }),
    open(href, target, features) { this.opened.push({ href, target, features }); },
  };
  win.location = { assign: (href) => win.assigned.push(href) };
  win.window = win;
  return win;
}

/* Runs a browser script (an IIFE relying on globals) against the stubs. */
export function runScript(source, globals) {
  const names = Object.keys(globals);
  // eslint-disable-next-line no-new-func
  const factory = new Function(...names, `"use strict";${source}\n;return typeof globalThis;`);
  factory(...names.map((name) => globals[name]));
}
