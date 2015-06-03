/**
 * @ngdoc module
 * @name material.components.menu
 */

// TODO(s)
//   - enable `width` attribute and set width based on spec (http://www.google.com/design/spec/components/menus.html#menus-specs)

angular.module('material.components.menu', [
  'material.core',
  'material.components.backdrop'
])
.directive('mdMenu', MenuDirective);

function MenuDirective($mdMenu) {
  return {
    restrict: 'E',
    require: 'mdMenu',
    controller: function() { }, // empty function to be built by link
    scope: true,
    compile: compile
  };

  function compile(tEl) {
    tEl.addClass('md-menu');
    return link;
  }

  function link(scope, el, attrs, mdMenuCtrl) {
    // Se up mdMenuCtrl to keep our code squeaky clean
    buildCtrl();

    // Expose a open function to the child scope for their html to use
    scope.$mdOpenMenu = function() {
      mdMenuCtrl.open();
    };

    if (el.children().length != 2) {
      throw new Error('Invalid HTML for md-menu. Expected two children elements.');
    }

    // Move everything into a md-menu-container
    var menuContainer = angular.element('<div class="md-open-menu-container md-whiteframe-z2"></div>');
    var menuContents = el.children()[1];
    menuContainer.append(menuContents);

    var enabled;
    mdMenuCtrl.enable();

    function buildCtrl() {
      mdMenuCtrl.enable = function enableMenu() {
        if (!enabled) {
          el.attr({'tabindex': attrs.tabindex, 'aria-disabled': 'false'});
          //el.on('keydown', handleKeypress);
          enabled = true;
        }
      };

      mdMenuCtrl.disable = function disableMenu() {
        if (enabled) {
          el.attr({'tabindex': -1, 'aria-disabled': 'true'});
          //el.off('keydown', handleKeypress);
          enabled = false;
        }
      };

      mdMenuCtrl.open = function openMenu() {
        el.attr('aria-expanded', 'true');
        $mdMenu.show({
          mdMenuCtrl: mdMenuCtrl,
          element: menuContainer,
          target: el[0]
        });
      };

      mdMenuCtrl.close = function closeMenu(skipFocus) {
        el.attr('aria-expanded', 'false');
        $mdMenu.hide();
        if (!skipFocus) el.focus();
      };

      mdMenuCtrl.attachFrom = function() {
        var attachment = attrs.mdAttachFrom || 'top left';
        var res = {};
        if (attachment.indexOf('top') != -1) {
          res.top = true;
          res.bottom = false;
          res.middle = false;
        } else if (attachment.indexOf('bottom') != -1) {
          res.bottom = true;
          res.top = false;
          res.middle = false;
        } else if (attachment.indexOf('middle') != -1) {
          res.middle = true;
          res.top = false;
          res.bottom = false;
        }

        if (attachment.indexOf('left') != -1) {
          res.left = true;
          res.right = false;
          res.center = false;
        } else if (attachment.indexOf('right') != -1) {
          res.right = true;
          res.left = false;
          res.center = false;
        } else if (attachment.indexOf('center') != -1) {
          res.center = true;
          res.left = false;
          res.right = false;
        }

        return res;
      };

      mdMenuCtrl.offsets = function() {
        var offsets = (attrs.mdOffset || '0 0').split(' ').map(function(x) { return parseFloat(x, 10); });
        if (offsets.length == 2) {
          return {
            left: offsets[0],
            top: offsets[1]
          };
        } else if (offsets.length == 1) {
          return {
            top: offsets[0],
            left: offsets[0]
          };
        } else {
          throw new Error('Invalid offsets specified. Please follow format <x, y> or <n>');
        }
      };
    }
  }
}
