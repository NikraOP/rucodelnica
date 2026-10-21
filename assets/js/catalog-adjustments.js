(function () {
  'use strict';

  var data = window.CATALOG;
  if (!data) return;

  var runners = data.categories.find(function (category) { return category.slug === 'begunki'; });
  if (runners) {
    runners.subs = runners.subs.filter(function (subcategory) { return subcategory.slug !== 'novye-modeli'; });
  }

  var rotations = {
    'slider-28.webp': 180,
    'slider-29.webp': 180,
    'slider-30.webp': 180,
    'slider-31.webp': 180,
    'slider-32.webp': 180,
    'slider-33.webp': 180,
    'slider-34.webp': 180,
    'slider-35.webp': 180,
    'slider-36.webp': 180,
    'slider-37.webp': 90,
    'slider-38.webp': 90,
    'slider-39.webp': 180
  };

  data.products.forEach(function (product) {
    if (!Object.prototype.hasOwnProperty.call(rotations, product.img)) return;
    product.sub = '';
    product.rotate = rotations[product.img];
  });
}());
