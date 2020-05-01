'use strict';

global.jQuery = require('jquery');
const pjax = require('jquery-pjax');
const $ = global.jQuery;
const doc = $(document);
const frctl = window.frctl || {};

const events = require('./events');
const utils = require('./utils');
const framer = require('./components/frame');
const Tree = require('./components/tree');
const Pen = require('./components/pen');
const Search = require('./components/search');

global.fractal = {
  events: events,
};

const frame = framer($('#frame'));
const navTrees = $.map($('[data-behaviour="tree"]'), (t) => new Tree(t));
const search = new Search($('[data-behaviour="search"]'), navTrees);
let pens = [];

let selectedComponent;

loadPen();

if (frctl.env === 'server') {
  doc
    .pjax(
      'a[data-pjax], code a[href], .Prose a[href]:not([data-no-pjax]), .Browser a[href]:not([data-no-pjax])',
      '#pjax-container',
      {
        fragment: '#pjax-container',
        timeout: 10000,
      }
    )
    .on('pjax:start', function (e, xhr, options) {
      if (utils.isSmallScreen()) {
        frame.closeSidebar();
      }
      frame.startLoad();
      events.trigger('main-content-preload', options.url);
    })
    .on('pjax:end', function () {
      events.trigger('main-content-loaded');
      frame.endLoad();
    })
    .on('click', '.Pen-variant-link', function (e) {
      selectedComponent = e.currentTarget;
      const variantUrl = selectedComponent.href;
      if (variantUrl && !$(this).hasClass('active')) {
        const component = $(this);
        $('.Pen-panel.Pen-preview').addClass('loading');
        $('.Pen-panel.Pen-preview').load(
          variantUrl + ' .Pen-panel.Pen-preview .Preview-wrapper',
          function () {
            events.trigger('main-content-loaded');
            switchComponent();
            $('.Pen-panel.Pen-preview').removeClass('loading');
          }
        );
      }
      e.preventDefault();
    });

  $(window).on('popstate', function (e) {
    $('.Pen-variant-link.active').removeClass('active');
    $('.Pen-variant-link[href="' + e.state.selectedHref + '"]').addClass(
      'active'
    );
    $('.Pen-panel.Pen-preview').html(e.state.componentHtml);
    events.trigger('main-content-loaded');
  });
}

events.on('main-content-loaded', loadPen);

function loadPen() {
  setTimeout(function () {
    pens = $.map($('[data-behaviour="pen"]'), (p) => new Pen(p));
  }, 1);
}

function trackHistory(currentComponent, url) {
  const selectedHref = $('.Pen-variant-link.active').attr('href');
  window.history.pushState(
    { componentHtml: currentComponent, selectedHref: selectedHref },
    '',
    url
  );
}

function switchComponent() {
  console.log(selectedComponent);
  let url;
  if (selectedComponent) {
    $('.Pen-variant-link.active').removeClass('active');
    $(selectedComponent).addClass('active');
    url = selectedComponent.href;
  } else {
    url = window.location.href;
  }
  const currentComponent = $('.Pen-panel.Pen-preview').html();
  trackHistory(currentComponent, url);
}
