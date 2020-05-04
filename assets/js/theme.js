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

let clickedVariant;

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

      const currentComponent = $('.Frame-panel--main').html();
      logState(currentComponent, window.location.href, true);
    })
    .on('click', '.Pen-variant-link', function (e) {
      const clickedVariant = e.currentTarget;
      const variantUrl = clickedVariant.href;
      if (variantUrl && !$(this).hasClass('active')) {
        $('.Pen-panel.Pen-preview').addClass('loading');
        $('.Pen-panel.Pen-preview').load(
          variantUrl + ' .Pen-panel.Pen-preview .Preview-wrapper',
          function () {
            events.trigger('main-content-loaded');
            switchVariant(clickedVariant);
          }
        );
      }
      e.preventDefault();
    });

  $(window).on('popstate', function (e) {
    if (e.state) {
      $('.Frame-panel--main').html(e.state.componentHtml);
      events.trigger('main-content-loaded');
    }
  });
}

events.on('main-content-loaded', loadPen);

//log initial state
const currentComponent = $('.Frame-panel--main').html();
logState(currentComponent, window.location.href, true);

function switchVariant(clickedVariant) {
  $('.Pen-variant-link.active').removeClass('active');
  $('.Pen-panel.Pen-preview').removeClass('loading');
  $(clickedVariant).addClass('active');
  const currentComponent = $('.Frame-panel--main').html();
  logState(currentComponent, clickedVariant.href);
}

function logState(currentComponent, url, replace = false) {
  const selectedHref = $('.Pen-variant-link.active').attr('href');
  if (replace) {
    window.history.replaceState(
      { componentHtml: currentComponent, selectedHref: selectedHref },
      '',
      url
    );
  } else {
    window.history.pushState(
      { componentHtml: currentComponent, selectedHref: selectedHref },
      '',
      url
    );
  }
}

function loadPen() {
  setTimeout(function () {
    pens = $.map($('[data-behaviour="pen"]'), (p) => new Pen(p));
  }, 1);
}
