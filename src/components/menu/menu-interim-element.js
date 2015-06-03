angular.module('material.components.menu')
.provider('$mdMenu', MenuProvider);

/*
 * Interim element provider for the menu.
 * Handles behavior for a menu while it is open, including:
 *    - handling animating the menu opening/closing
 *    - handling key/mouse events on the menu element
 *    - handling enabling/disabling scroll while the menu is open
 *    - handling redrawing during resizes and orientation changes
 *
 */

function MenuProvider($$interimElementProvider) {
  var MENU_EDGE_MARGIN = 8;

  return $$interimElementProvider('$mdMenu')
    .setDefaults({
      methods: ['target'],
      options: menuDefaultOptions
    });

  /* @ngInject */
  function menuDefaultOptions($$rAF, $window, $mdUtil, $mdTheming, $timeout, $mdConstant) {
    return {
      parent: 'body',
      onShow: onShow,
      onRemove: onRemove,
      hasBackdrop: true,
      disableParentScroll: true,
      themable: true
    };

    // Interim element onShow fn, handles inserting it into the DOM, wiring up
    // listeners and calling the positioning fn
    function onShow(scope, element, opts) {
      if (!opts.target) {
        throw new Error('$mdMenu.show() expected a target to animate from in options.target');
      }

      angular.extend(opts, {
        isRemoved: false,
        target: angular.element(opts.target), //make sure it's not a naked dom node
        parent: angular.element(opts.parent),
        menuContentEl: angular.element(element[0].querySelector('md-menu-content')),
        backdrop: opts.hasBackdrop && angular.element('<md-backdrop class="md-menu-backdrop md-click-catcher">')
      });

      $mdTheming.inherit(opts.menuContentEl, opts.target);

      opts.resizeFn = function() {
        positionMenu(scope, element, opts);
      };
      angular.element($window).on('resize', opts.resizeFn);
      angular.element($window).on('orientationchange', opts.resizeFn);

      if (opts.disableParentScroll) {
        opts.restoreScroll = $mdUtil.disableScrollAround(opts.target);
      }

      // Only activate click listeners after a short time to stop accidental double taps/clicks
      // from clicking the wrong item
      $timeout(activateInteraction, 75, false);

      if (opts.backdrop) {
        $mdTheming.inherit(opts.backdrop, opts.parent);
        opts.parent.append(opts.backdrop);
      }
      opts.parent.append(element);

      element.removeClass('md-leave');
      $$rAF(function() {
        $$rAF(function() {
          positionMenu(scope, element, opts);
          $$rAF(function() {
            element.addClass('md-active');
            element[0].style[$mdConstant.CSS.TRANSFORM] = '';
          });
        });
      });

      return $mdUtil.transitionEndPromise(element, {timeout: 350});


      // Activate interaction on the menu popup, allowing it to be closed by
      // clicking on the backdrop, with escape, clicking options, etc.
      function activateInteraction() {
        element.addClass('md-clickable');
        opts.backdrop && opts.backdrop.on('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          opts.mdMenuCtrl.close(true);
        });

        opts.menuContentEl.on('keydown', function(ev) {
          scope.$apply(function() {
            switch (ev.keyCode) {
              case $mdConstant.KEY_CODE.ESCAPE: opts.mdMenuCtrl.close();
            }
          });
        });

        opts.menuContentEl.on('click', function(e) {
          if (e.target && e.target.hasAttribute('ng-click')) {
            scope.$apply(function() {
              opts.mdMenuCtrl.close();
            });
          }
        });

        opts.menuContentEl.focus();
      }
    }

    // Interim element onRemove fn, handles removing the element from the DOM
    function onRemove(scope, element, opts) {
      opts.isRemoved = true;
      element.addClass('md-leave')
        .removeClass('md-clickable');
      angular.element($window).off('resize', opts.resizeFn);
      angular.element($window).off('orientationchange', opts.resizeFn);
      opts.resizeFn = undefined;

      return $mdUtil.transitionEndPromise(element, { timeout: 350 }).then(function() {
        element.removeClass('md-active');
        opts.backdrop && opts.backdrop.remove();
        if (element[0].parentNode === opts.parent[0]) {
          opts.parent[0].removeChild(element[0]);
        }
        opts.restoreScroll && opts.restoreScroll();
      });
    }

    // Handles computing the pop-ups position relative to the target (origin md-menu)
    function positionMenu(scope, el, opts) {
      if (opts.isRemoved) return;
      // Delay a couple frames to 'initialize' in the DOM for position calcs
      var containerNode = el[0],
          openMenuNode = el[0].firstElementChild,
          boundryNode = opts.parent[0],
          boundryNodeRect = boundryNode.getBoundingClientRect();

      var originNode = opts.target[0].querySelector('[md-menu-origin]') || opts.target[0],
          originNodeRect = originNode.getBoundingClientRect();

      var menuStyle = $window.getComputedStyle(openMenuNode);

      var bounds = {
        left: boundryNodeRect.left + MENU_EDGE_MARGIN,
        top: boundryNodeRect.top + MENU_EDGE_MARGIN,
        bottom: boundryNodeRect.bottom - MENU_EDGE_MARGIN,
        right: boundryNodeRect.right - MENU_EDGE_MARGIN
      };

      var attachFrom = opts.mdMenuCtrl.attachFrom();

      var position = { };
      var transformOrigin = '';

      if (attachFrom.top) {
        position.top = originNodeRect.top - parseFloat(menuStyle.paddingTop, 10);
        transformOrigin += 'top ';
      } else if (attachFrom.bottom) {
        position.top = originNodeRect.top + originNodeRect.height;
      }

      if (attachFrom.left) {
        position.left = originNodeRect.left - parseFloat(menuStyle.paddingLeft, 10);
      } else if (attachFrom.right) {
        position.left = originNodeRect.right - containerNode.offsetWidth + parseFloat(menuStyle.paddingRight, 10);
        transformOrigin += 'right';
      } else if (attachFrom.center) {
        position.left = (originNodeRect.left + originNodeRect.width) - containerNode.offsetWidth / 2;
      }

      var offsets = opts.mdMenuCtrl.offsets();
      position.top += offsets.top;
      position.left += offsets.left;
      clamp(position);
      el.css(position);

      containerNode.style[$mdConstant.CSS.TRANSFORM_ORIGIN] = transformOrigin;

      containerNode.style[$mdConstant.CSS.TRANSFORM] = 'scale(' +
        Math.min(originNodeRect.width / containerNode.offsetWidth, 1.0) + ',' +
        Math.min(originNodeRect.height / containerNode.offsetHeight, 1.0) +
      ')';

      function clamp(pos) {
        pos.top = Math.max(Math.min(pos.top, bounds.bottom - containerNode.offsetHeight), bounds.top);
        pos.left = Math.max(Math.min(pos.left, bounds.right - containerNode.offsetWidth), bounds.left);
      }
    }
  }
}
