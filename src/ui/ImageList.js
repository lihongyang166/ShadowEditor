import Div from './Div';

/**
 * 图片列表
 * @param {*} options 选项
 */
function ImageList(options) {
    Container.call(this, options);
}

ImageList.prototype = Object.create(Container.prototype);
ImageList.prototype.constructor = ImageList;

ImageList.prototype.render = function () {
    this.dom = document.createElement('div')

};

export default ImageList;