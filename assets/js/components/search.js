'use strict';

const $ = global.jQuery;
const utils = require('../utils');
const storage = require('../storage');

const whitespaceRegex = /^\s*$/;

class Search {
  constructor(el, navTrees) {
    this._navTrees = navTrees;
    this._el = $(el);
    const initialValue = storage.get('search.value', '');
    this._el.attr('value', initialValue);

    this.trees = navTrees.map((navTree) => ({
      navTree,
      searchTree: this.createSearchTree(navTree._el),
    }));

    if (initialValue !== '') {
      for (const tree of this.trees) {
        this.updateTree(tree, initialValue);
      }
    }

    this._el.on(
      'input',
      utils.debounce((e) => {
        const value = e.target.value;
        storage.set('search.value', value);
        for (const tree of this.trees) {
          this.updateTree(tree, value);
        }
      }, 200)
    );
  }

  createSearchTree(element, parent = undefined) {
    const tree = {
      parent,
      element: parent && element,
      text:
        parent &&
        element
          .children('.Tree-entityLink,.Tree-collectionLabel')
          .text()
          .trim()
          .toLowerCase(),
    };

    tree.children = $.map(element.find('> ul > li.Tree-item'), (child) =>
      this.createSearchTree($(child), tree)
    );

    return tree;
  }

  updateTree(tree, rawPhrase) {
    const { navTree, searchTree } = tree;
    const phrase = rawPhrase.trim().toLowerCase();
    const invalidPhrase = whitespaceRegex.test(phrase);
    if (invalidPhrase) {
      navTree._applyState();
    }
    const queue = [{ item: searchTree, showState: false }];
    while (queue.length > 0) {
      let { item: current, showState } = queue.shift();
      let found;
      if (!invalidPhrase) {
        found = current.text && current.text.includes(phrase);
        if (found) {
          navTree.expandAll(true);
          let parent = current.parent;
          while (parent) {
            parent.element && parent.element.show();
            parent = parent.parent;
          }
        }
      }
      const show = invalidPhrase || found || showState;
      if (show) {
        showState = true;
        current.element && current.element.show();
      } else if (!showState) {
        current.element && current.element.hide();
      }
      for (const child of current.children) {
        queue.push({ item: child, showState: show });
      }
    }
  }
}

module.exports = Search;
