'use strict';

const $ = global.jQuery;
const utils = require('../utils');
const storage = require('../storage');
const fuzzy = require('fuzzy');

const whitespaceRegex = /^\s*$/;

class Search {
  constructor(el, navTrees) {
    this._el = $(el);

    // Get search text from local storage and set search field value.
    const initialValue = storage.get('search.value', '');
    this._el.attr('value', initialValue);

    // Assemble all of the trees.
    this.trees = navTrees.map((navTree) => ({
      navTree,
      searchTree: this.createSearchTree(navTree._el),
    }));

    // If the initial search text is not blank show/hide matching items.
    if (initialValue !== '') {
      for (const tree of this.trees) {
        this.updateTree(tree, initialValue);
      }
    }

    // Add an event listener for user input to show/hide matching items.
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

  /**
   * Creates an object tree structure for the given nav tree.
   *
   * @param {JQuery} element - Nav tree or tree item jQuery reference.
   * @param {Object} parent - Parent tree for nested structure (used internally for recursion).
   * @returns A fully formed search tree.
   */
  createSearchTree(element, parent = undefined) {
    const tree = {
      parent,
      // Store the current jQuery reference.
      element: parent && element,
      // Add the current label for search checking later down the line.
      text:
        parent &&
        element
          .find('> .Tree-entityLink > span, > .Tree-collectionLabel > span')
          .text(),
    };

    // Create sub trees for all the child tree items.
    tree.children = $.map(element.find('> ul > li.Tree-item'), (child) =>
      this.createSearchTree($(child), tree)
    );

    return tree;
  }

  /**
   * Shows/hides members of the given tree if they match the given phrase.
   *
   * @param {Object} tree - The tree structure to update.
   * @param {*} rawPhrase - The raw search field phrase.
   */
  updateTree(tree, rawPhrase) {
    const { navTree, searchTree } = tree;
    const phrase = rawPhrase.trim().toLowerCase();
    // Check if the phrase is just whitespace.
    const invalidPhrase = whitespaceRegex.test(phrase);
    // Reset the nav tree state if we are not performing a search.
    if (invalidPhrase) {
      navTree._applyState();
    }
    const queue = [{ item: searchTree, showState: false }];
    // Loop while there are still items in the queue.
    while (queue.length > 0) {
      let { item: current, showState } = queue.shift();
      let found;
      current.element &&
        current.element
          .find('> .Tree-entityLink > span, > .Tree-collectionLabel > span')
          .html(current.text);
      if (!invalidPhrase) {
        // Check if the current item text matches the phrase.
        found =
          current.text &&
          fuzzy.match(phrase, current.text, { pre: '<b>', post: '</b>' });
        // If we have a match traverse all the way up showing each element.
        if (found) {
          current.element &&
            current.element
              .find('> .Tree-entityLink > span,> .Tree-collectionLabel > span')
              .html(found.rendered);
          navTree.expandAll(true);
          let parent = current.parent;
          while (parent) {
            parent.element && parent.element.show();
            parent = parent.parent;
          }
        }
      }
      const show = invalidPhrase || found || showState;
      // Show/hide the current element/
      if (show) {
        // A show state of true will be passed to all children allowing collections to be matched.
        showState = true;
        current.element && current.element.show();
      } else if (!showState) {
        current.element && current.element.hide();
      }
      // Add all the current children to the queue.
      for (const child of current.children) {
        queue.push({ item: child, showState: show });
      }
    }
  }
}

module.exports = Search;
