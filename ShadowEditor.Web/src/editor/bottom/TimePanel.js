import UI from '../../ui/UI';

var ID = -1;

const STOP = 0;
const PLAY = 1;
const PAUSE = 2;

/**
 * 时间面板
 * @author tengge / https://github.com/tengge1
 */
function TimePanel(options) {
    UI.Control.call(this, options);
    this.app = options.app;

    this.status = STOP;
    this.sliderLeft = 0;
    this.speed = 4;

    this.isDragging = false;
};

TimePanel.prototype = Object.create(UI.Control.prototype);
TimePanel.prototype.constructor = TimePanel;

TimePanel.prototype.render = function () {
    var data = {
        xtype: 'div',
        parent: this.parent,
        cls: 'animation-panel',
        children: [{
            xtype: 'div',
            cls: 'controls',
            children: [{
                xtype: 'iconbutton',
                icon: 'icon-add',
                onClick: this.onAddLayer.bind(this)
            }, {
                xtype: 'iconbutton',
                icon: 'icon-delete',
                onClick: this.onRemoveLayer.bind(this)
            }, {
                xtype: 'div',
                style: {
                    width: '2px',
                    height: '20px',
                    borderLeft: '1px solid #aaa',
                    borderRight: '1px solid #aaa',
                    boxSizing: 'border-box',
                    margin: '5px 8px'
                }
            }, {
                xtype: 'iconbutton',
                icon: 'icon-backward',
                onClick: this.onBackward.bind(this)
            }, {
                xtype: 'iconbutton',
                id: 'btnPlay',
                scope: this.id,
                icon: 'icon-play',
                onClick: this.onPlay.bind(this)
            }, {
                xtype: 'iconbutton',
                id: 'btnPause',
                scope: this.id,
                icon: 'icon-pause',
                style: {
                    display: 'none'
                },
                onClick: this.onPause.bind(this)
            }, {
                xtype: 'iconbutton',
                icon: 'icon-forward',
                onClick: this.onForward.bind(this)
            }, {
                xtype: 'iconbutton',
                icon: 'icon-stop',
                onClick: this.onStop.bind(this)
            }, {
                xtype: 'text',
                id: 'time',
                scope: this.id,
                style: {
                    marginLeft: '8px',
                    color: '#555',
                    fontSize: '12px'
                },
                text: '00:00'
            }, {
                xtype: 'text',
                id: 'speed',
                scope: this.id,
                style: {
                    marginLeft: '8px',
                    color: '#aaa',
                    fontSize: '12px'
                },
                text: 'X 1'
            }, {
                xtype: 'toolbarfiller'
            }, {
                xtype: 'text',
                scope: this.id,
                style: {
                    marginLeft: '8px',
                    color: '#aaa',
                    fontSize: '12px'
                },
                text: '说明：双击时间轴下方区域添加动画。'
            }]
        }, {
            xtype: 'div',
            cls: 'box',
            children: [{
                xtype: 'div',
                cls: 'left-area',
                id: 'layerInfo',
                scope: this.id
            }, {
                xtype: 'div',
                cls: 'right-area',
                children: [{
                    xtype: 'timeline',
                    id: 'timeline',
                    cls: 'timeline',
                    scope: this.id
                }, {
                    xtype: 'div',
                    cls: 'layers',
                    id: 'layers',
                    scope: this.id,
                    children: []
                }, {
                    xtype: 'div',
                    cls: 'slider',
                    id: 'slider',
                    scope: this.id
                }]
            }]
        }]
    };

    var control = UI.create(data);
    control.render();

    this.app.on(`appStarted.${this.id}`, this.onAppStarted.bind(this));
};

TimePanel.prototype.onAppStarted = function () {
    var timeline = UI.get('timeline', this.id);
    var layers = UI.get('layers', this.id);

    timeline.updateUI();
    layers.dom.style.width = timeline.dom.clientWidth + 'px';

    layers.dom.addEventListener(`click`, this.onClick.bind(this));
    layers.dom.addEventListener(`dblclick`, this.onDblClick.bind(this));
    layers.dom.addEventListener(`mousedown`, this.onMouseDown.bind(this));
    layers.dom.addEventListener(`mousemove`, this.onMouseMove.bind(this));
    document.body.addEventListener(`mouseup`, this.onMouseUp.bind(this));

    this.app.on(`animationChanged.${this.id}`, this.updateUI.bind(this));
    this.app.on(`resetAnimation.${this.id}`, this.onResetAnimation.bind(this));
    this.app.on(`startAnimation.${this.id}`, this.onPlay.bind(this));
};

TimePanel.prototype.updateUI = function () {
    var animations = this.app.editor.animations;

    var timeline = UI.get('timeline', this.id);
    var layerInfo = UI.get('layerInfo', this.id);
    var layers = UI.get('layers', this.id);

    while (layerInfo.dom.children.length) {
        var child = layerInfo.dom.children[0];
        layerInfo.dom.removeChild(child);
    }

    while (layers.dom.children.length) {
        var child = layers.dom.children[0];
        child.data = null;
        layers.dom.removeChild(child);
    }

    animations.forEach(n => {
        // 动画组信息区
        var layerName = document.createElement('div');
        layerName.className = 'layer-info';
        layerName.innerHTML = `<input type="checkbox" data-uuid="${n.uuid}" />${n.layerName}`;
        layerInfo.dom.appendChild(layerName);

        // 动画区
        var layer = document.createElement('div');
        layer.className = 'layer';
        layer.setAttribute('droppable', true);
        layer.data = n;
        layer.addEventListener('dragenter', this.onDragEnterLayer.bind(this));
        layer.addEventListener('dragover', this.onDragOverLayer.bind(this));
        layer.addEventListener('dragleave', this.onDragLeaveLayer.bind(this));
        layer.addEventListener('drop', this.onDropLayer.bind(this));
        layers.dom.appendChild(layer);

        n.animations.forEach(m => {
            var item = document.createElement('div');
            item.data = m;
            item.className = 'item';
            item.setAttribute('draggable', true);
            item.setAttribute('droppable', false);
            item.style.left = m.beginTime * timeline.scale + 'px';
            item.style.width = (m.endTime - m.beginTime) * timeline.scale + 'px';
            item.innerHTML = m.name;
            item.addEventListener('dragstart', this.onDragStartAnimation.bind(this));
            item.addEventListener('dragend', this.onDragEndAnimation.bind(this));
            layer.appendChild(item);
        });
    });
};

TimePanel.prototype.updateSlider = function () {
    var timeline = UI.get('timeline', this.id);
    var slider = UI.get('slider', this.id);
    var time = UI.get('time', this.id);
    var speed = UI.get('speed', this.id);

    slider.dom.style.left = this.sliderLeft + 'px';

    var animationTime = this.sliderLeft / timeline.scale;

    var minute = ('0' + Math.floor(animationTime / 60)).slice(-2);
    var second = ('0' + Math.floor(animationTime % 60)).slice(-2);

    time.setValue(`${minute}:${second}`);

    if (this.speed >= 4) {
        speed.dom.innerHTML = `X ${this.speed / 4}`;
    } else {
        speed.dom.innerHTML = `X 1/${4 / this.speed}`;
    }

    this.app.call('animationTime', this, animationTime);
};

TimePanel.prototype.onAnimate = function () {
    var timeline = UI.get('timeline', this.id);
    this.sliderLeft += this.speed / 4;

    if (this.sliderLeft >= timeline.dom.clientWidth) {
        this.sliderLeft = 0;
    }

    this.updateSlider();
};

TimePanel.prototype.onAddLayer = function () {
    var animations = this.app.editor.animations;

    var maxLayer = Math.max.apply(Math, animations.map(n => n.layer));

    var animation = {
        id: null,
        uuid: THREE.Math.generateUUID(),
        layer: maxLayer + 1,
        layerName: `动画层${maxLayer + 2}`,
        animations: []
    };
    this.app.editor.animations.push(animation);
    this.updateUI();
};

TimePanel.prototype.onRemoveLayer = function () {
    var inputs = document.querySelectorAll('.animation-panel .left-area input:checked');

    var uuids = [];
    inputs.forEach(n => {
        uuids.push(n.getAttribute('data-uuid'));
    });

    if (uuids.length === 0) {
        UI.msg('请勾选需要删除的层！');
        return;
    }

    var animations = this.app.editor.animations;

    UI.confirm('询问', '删除层会删除层上的所有动画。是否删除？', (event, btn) => {
        if (btn === 'ok') {
            uuids.forEach(n => {
                var index = animations.findIndex(m => m.uuid === n);
                if (index > -1) {
                    animations.splice(index, 1);
                }
            });
            this.updateUI();
        }
    });
};

// ----------------------------------- 播放器事件 -------------------------------------------

TimePanel.prototype.onPlay = function () {
    if (this.status === PLAY) {
        return;
    }
    this.status = PLAY;

    UI.get('btnPlay', this.id).dom.style.display = 'none';
    UI.get('btnPause', this.id).dom.style.display = '';

    this.app.on(`animate.${this.id}`, this.onAnimate.bind(this));
};

TimePanel.prototype.onPause = function () {
    if (this.status === PAUSE) {
        return;
    }
    this.status = PAUSE;

    UI.get('btnPlay', this.id).dom.style.display = '';
    UI.get('btnPause', this.id).dom.style.display = 'none';

    this.app.on(`animate.${this.id}`, null);
    this.updateSlider();
};

TimePanel.prototype.onForward = function () {
    if (this.speed >= 16) {
        return;
    }
    this.speed *= 2;
};

TimePanel.prototype.onBackward = function () {
    if (this.speed <= 1) {
        return;
    }
    this.speed /= 2;
};

TimePanel.prototype.onStop = function () {
    if (this.status === STOP) {
        return;
    }
    this.status = STOP;

    UI.get('btnPlay', this.id).dom.style.display = '';
    UI.get('btnPause', this.id).dom.style.display = 'none';

    this.app.on(`animate.${this.id}`, null);
    this.sliderLeft = 0;
    this.updateSlider();
};

TimePanel.prototype.onResetAnimation = function () {
    this.onStop();
    this.speed = 4;
};

TimePanel.prototype.onClick = function (event) {
    // if (event.target.data.type === 'AnimationGroup') {
    //     return;
    // }
    // this.app.call('tabSelected', this, 'animation');
    // this.app.call('animationSelected', this, event.target.data);
};

TimePanel.prototype.onDblClick = function (event) {
    var timeline = UI.get('timeline', this.id);

    if (event.target.data && event.target.data.layer !== undefined) {
        event.stopPropagation();

        var animation = {
            id: null,
            uuid: THREE.Math.generateUUID(),
            name: `动画${ID--}`,
            target: null,
            type: 'Tween',
            beginTime: event.offsetX / timeline.scale,
            endTime: (event.offsetX + 80) / timeline.scale
        };

        event.target.data.animations.push(animation);
        this.app.call('animationChanged', this);
    }
};

TimePanel.prototype.onMouseDown = function () {
    if (this.isDragging) {
        return;
    }
    this.isDragging = true;
};

TimePanel.prototype.onMouseMove = function () {

};

TimePanel.prototype.onMouseUp = function () {
    this.isDragging = false;
};

// ----------------------- 拖动动画事件 ---------------------------------------------

TimePanel.prototype.onDragStartAnimation = function (event) {
    event.dataTransfer.setData('uuid', event.target.data.uuid);
    event.dataTransfer.setData('offsetX', event.offsetX);
};

TimePanel.prototype.onDragEndAnimation = function (event) {
    event.dataTransfer.clearData();
};

TimePanel.prototype.onDragEnterLayer = function (event) {
    event.preventDefault();
};

TimePanel.prototype.onDragOverLayer = function (event) {
    event.preventDefault();
};

TimePanel.prototype.onDragLeaveLayer = function (event) {
    event.preventDefault();
};

TimePanel.prototype.onDropLayer = function (event) {
    event.preventDefault();
    var uuid = event.dataTransfer.getData('uuid');
    var offsetX = event.dataTransfer.getData('offsetX');

    // var groups = this.app.editor.animation.getAnimationGroups();
    // var group = groups.filter(n => n.animations.findIndex(m => m.uuid === uuid) > -1)[0];
    // var animation = group.animations.filter(n => n.uuid === uuid)[0];
    // group.remove(animation);

    // var timeline = UI.get('timeline', this.id);
    // var length = animation.endTime - animation.beginTime;
    // animation.beginTime = (event.offsetX - offsetX) / timeline.scale;
    // animation.endTime = animation.beginTime + length;

    // if (event.target.data instanceof Animation) { // 拖动到其他动画上
    //     event.target.parentElement.data.add(animation);
    // } else { // 拖动到动画组上
    //     event.target.data.add(animation);
    // }

    // this.updateUI();
};

export default TimePanel;