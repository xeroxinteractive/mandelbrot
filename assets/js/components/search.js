'use strict';

const $ = global.jQuery;
const utils = require('../utils');

const whitespaceRegex = /^\s*$/;

class Search {
  constructor(el, navTrees) {
    this._navTrees = navTrees;
    this._el = $(el);

    this.trees = navTrees.map((navTree) => ({
      navTree,
      searchTree: this.createSearchTree(navTree._el),
    }));

    this._el.on(
      'input',
      utils.debounce((e) => {
        for (const tree of this.trees) {
          this.updateTree(tree, e.target.value);
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

  // match(element, phrase) {
  //   return element
  //     .text()
  //     .trim()
  //     .toLowerCase()
  //     .includes(phrase);
  // }

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

  // updateSearch(phrase) {
  //   const invalidPhrase = whitespaceRegex.test(phrase);
  //   for (const tree of this._navTrees) {
  //     tree.show();
  //     let treeCount = 0;
  //     for (const collection of tree._collections) {
  //       collection.show();
  //       let collectionCount = 0;
  //       const items = collection._el.find('[data-role="item"]');
  //       for (const item of items) {
  //         const $item = $(item);
  //         $item.css({ display: '' });
  //         if (this.match($item, phrase)) {
  //           treeCount++;
  //           collectionCount++;
  //           collection.open(true);
  //         } else if (!invalidPhrase) {
  //           $item.css({ display: 'none' });
  //         }
  //       }
  //       if (!invalidPhrase) {
  //         if (this.match(collection._el, phrase)) {
  //           console.log('collection match?');
  //           console.log(collection);
  //           collection.show();
  //           collection.open(true);
  //           for (const item of items) {
  //             console.log('item');
  //             const $item = $(item);
  //             $item.css({ display: '' });
  //           }
  //         } else if (collectionCount === 0) {
  //           collection.hide();
  //         }
  //       }
  //     }
  //     if (!invalidPhrase) {
  //       if (this.match(tree._el, phrase)) {
  //         tree.show();
  //       } else if (treeCount === 0) {
  //         tree.hide();
  //       }
  //     }
  //   }
  // }
}

module.exports = Search;
