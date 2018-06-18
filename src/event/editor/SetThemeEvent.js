import BaseEvent from '../BaseEvent';

/**
 * 设置主题事件
 * @param {*} app 
 */
function SetThemeEvent(app) {
    BaseEvent.call(this, app);
}

SetThemeEvent.prototype = Object.create(BaseEvent.prototype);
SetThemeEvent.prototype.constructor = SetThemeEvent;

SetThemeEvent.prototype.start = function () {
    var _this = this;
    this.app.on('setTheme.' + this.id, function (theme) {
        _this.onSetTheme(theme);
    });
};

SetThemeEvent.prototype.stop = function () {
    this.app.on('setTheme.' + this.id, null);
};

SetThemeEvent.prototype.onSetTheme = function (theme) {
    var signals = this.app.editor.signals;

    document.getElementById('theme').href = theme;
    this.app.call('themeChanged', this, theme);
};

export default SetThemeEvent;