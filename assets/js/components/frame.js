'use strict';

const $ = global.jQuery;
const storage = require('../storage');
const utils = require('../utils');
const events = require('../events');
const config = require('../config');

module.exports = function(element) {
  const win = $(window);
  const doc = $(document);
  const el = $(element);
  const id = el[0].id;
  const dir = $('html').attr('dir');
  const header = el.find('> [data-role="header"]');
  const body = el.find('> [data-role="body"]');
  const sidebarToggle = el.find('[data-action="toggle-sidebar"]');
  const javascriptToggle = el.find('[data-action="toggle-javascript"]');
  const directionToggle = el.find('[data-action="toggle-direction"]');
  const mobileAction = el.find('[data-action="action-mobile"]');
  const tabletAction = el.find('[data-action="action-tablet"]');
  const desktopAction = el.find('[data-action="action-desktop"]');
  const sidebar = body.children('[data-role="sidebar"]');
  const main = body.children('[data-role="main"]');
  const handle = body.children('[data-role="frame-resize-handle"]');
  const sidebarMin = parseInt(sidebar.css('min-width'), 10);

  let sidebarWidth = utils.isSmallScreen()
    ? sidebarMin
    : storage.get(`frame.sidebar`, sidebar.outerWidth());
  let sidebarState = utils.isSmallScreen()
    ? 'closed'
    : storage.get(`frame.state`, 'open');
  let javascriptState = storage.get('frame.javascript', true);
  let directionState = storage.get('frame.direction', 'ltr');
  const scrollPos = storage.get(`frame.scrollPos`, 0);
  let previewWidth = storage.get('preview.width', undefined);
  let dragOccuring = false;
  let isInitialClose = false;
  let handleClicks = 0;

  sidebar.outerWidth(sidebarWidth);

  if (sidebarState === 'closed') {
    isInitialClose = true;
    closeSidebar();
  }

  toggleJavaScript(javascriptState);

  toggleDirection(directionState);

  setFrameWidth(previewWidth, true);

  sidebar.scrollTop(scrollPos);

  handle.on('mousedown', (e) => {
    handleClicks++;
    setTimeout(function() {
      handleClicks = 0;
    }, 400);
    if (handleClicks === 2) {
      dragOccuring = false;
      toggleSidebar();
      handleClicks = 0;
      e.stopImmediatePropagation();
      return;
    }
  });

  sidebar.resizable({
    handleSelector: '[data-role="frame-resize-handle"]',
    resizeHeight: false,
    onDragStart: (e) => {
      el.addClass('is-resizing');
      events.trigger('start-dragging');
    },
    onDragEnd: (e) => {
      setSidebarWidth(sidebar.outerWidth());
      el.removeClass('is-resizing');
      events.trigger('end-dragging');
      if (sidebarState === 'closed') {
        dragOccuring = false;
        openSidebar();
      }
    },
    resizeWidthFrom: dir === 'rtl' ? 'left' : 'right',
  });

  sidebar.on(
    'scroll',
    utils.debounce((e) => {
      storage.set(`frame.scrollPos`, sidebar.scrollTop());
    }, 50)
  );

  win.on('resize', () => {
    if (sidebarState === 'open' && doc.outerWidth() < sidebarWidth + 50) {
      // setSidebarWidth(doc.outerWidth() - 50);
    }
  });

  // Global event listeners

  events.on('toggle-sidebar', toggleSidebar);
  events.on('start-dragging', (e) => (dragOccuring = true));
  events.on('end-dragging', function() {
    setTimeout(function() {
      dragOccuring = false;
    }, 200);
  });

  events.on('data-changed', function() {
    // TODO: make this smarter?
    document.location.reload(true);
  });

  function closeSidebar() {
    if (dragOccuring || (!isInitialClose && sidebarState === 'closed')) return;
    const w = sidebar.outerWidth();
    const translate = dir === 'rtl' ? w + 'px' : -1 * w + 'px';
    const sidebarProps = {
      transform: `translate3d(${translate}, 0, 0)`,
    };
    if (dir === 'rtl') {
      sidebarProps.marginLeft = -1 * w + 'px';
    } else {
      sidebarProps.marginRight = -1 * w + 'px';
    }
    sidebarProps.transition = isInitialClose ? 'none' : '.3s ease all';
    body.css(sidebarProps);
    sidebarState = 'closed';
    el.addClass('is-closed');
    storage.set(`frame.state`, sidebarState);
    isInitialClose = false;
  }

  function openSidebar() {
    if (dragOccuring || sidebarState === 'open') return;
    if (utils.isSmallScreen()) {
      setSidebarWidth(sidebarMin);
    }
    body.css({
      marginRight: 0,
      marginLeft: 0,
      transition: '.3s ease all',
      transform: `translate3d(0, 0, 0)`,
    });
    sidebarState = 'open';
    el.removeClass('is-closed');
    storage.set(`frame.state`, sidebarState);
  }

  function toggleSidebar() {
    sidebarState === 'open' ? closeSidebar() : openSidebar();
    return false;
  }

  sidebarToggle.on('click', toggleSidebar);

  function setSidebarWidth(width) {
    sidebarWidth = width;
    sidebar.outerWidth(width);
    storage.set(`frame.sidebar`, width);
  }

  function toggleJavaScript(state = !javascriptState) {
    const iframe = document.querySelector('.Preview-iframe');
    if (iframe) {
      javascriptState = state;
      if (javascriptState) {
        iframe.sandbox =
          'allow-same-origin allow-scripts allow-forms allow-modals';
      } else {
        iframe.sandbox = 'allow-same-origin allow-forms allow-modals';
      }
      iframe.contentWindow.location.reload();
      if (javascriptState) {
        el.removeClass('javascript-disabled');
      } else {
        el.addClass('javascript-disabled');
      }
      storage.set('frame.javascript', javascriptState);
    }
  }

  javascriptToggle.on('click', () => toggleJavaScript());

  function toggleDirection(state = directionState === 'rtl' ? 'ltr' : 'rtl') {
    const iframe = document.querySelector('.Preview-iframe');
    const iframeHtml =
      iframe && iframe.contentWindow.document.getElementsByTagName('html')[0];
    if (iframeHtml) {
      directionState = state;
      iframeHtml.dir = state;
      if (state !== 'rtl') {
        el.removeClass('is-rtl');
      } else {
        el.addClass('is-rtl');
      }
      storage.set('frame.direction', directionState);
    }
  }

  directionToggle.on('click', () => toggleDirection());

  function setFrameWidth(width, initial = false) {
    const preview = doc.find('.Preview-wrapper');
    if (preview) {
      previewWidth = width;
      preview.css({
        width: `${width}px`,
        transition: initial ? 'none' : '0.5s ease width',
      });
      storage.set('preview.width', previewWidth);
    }
  }

  mobileAction.on('click', () => setFrameWidth(385));

  tabletAction.on('click', () => setFrameWidth(778));

  desktopAction.on('click', () => setFrameWidth(1210));

  return {
    closeSidebar: closeSidebar,

    openSidebar: openSidebar,

    startLoad: function() {
      main.addClass('is-loading');
    },

    endLoad: function() {
      main.removeClass('is-loading');
    },
  };
};
