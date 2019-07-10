import './css/Tree.css';
import classNames from 'classnames/bind';
import PropTypes from 'prop-types';

import CheckBox from '../form/CheckBox.jsx';

/**
 * 树
 * @author tengge / https://github.com/tengge1
 */
class Tree extends React.Component {
    constructor(props) {
        super(props);

        const { onExpand, onSelect, onDoubleClick } = this.props;

        this.handleExpandNode = this.handleExpandNode.bind(this, onExpand);
        this.handleClick = this.handleClick.bind(this, onSelect);
        this.handleDoubleClick = this.handleDoubleClick.bind(this, onDoubleClick);

        this.handleDrag = this.handleDrag.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }

    render() {
        const { data, className, style } = this.props;

        // 创建节点
        var list = [];

        Array.isArray(data) && data.forEach(n => {
            list.push(this.createNode(n));
        });

        return <ul className={classNames('Tree', className)} style={style}>{list}</ul>;
    }

    createNode(data) {
        const leaf = !data.children || data.children.length === 0;

        const children = leaf ? null : (<ul className={classNames('sub', data.expanded ? null : 'collpase')}>{data.children.map(n => {
            return this.createNode(n);
        })}</ul>);

        let checkbox = null;

        if (data.checked === true || data.checked === false) {
            checkbox = <CheckBox selected={data.checked} />;
        }

        return <li
            className={classNames('node', this.props.selected === data.value && 'selected')}
            value={data.value}
            key={data.value}
            onClick={this.handleClick}
            onDoubleClick={this.handleDoubleClick}
            draggable={true}
            droppable={true}
            onDrag={this.handleDrag}
            onDragStart={this.handleDragStart}
            onDragOver={this.handleDragOver}
            onDragLeave={this.handleDragLeave}
            onDrop={this.handleDrop}>
            <i className={classNames('expand', leaf ? null : (data.expanded ? 'minus' : 'plus'))} value={data.value} onClick={this.handleExpandNode}></i>
            {checkbox}
            <i className={classNames('type', leaf ? 'node' : (data.expanded ? 'open' : 'close'))}></i>
            <a href={'javascript:;'}>{data.text}</a>
            {leaf ? null : children}
        </li>;
    }

    handleExpandNode(onExpand, event) {
        event.stopPropagation();
        const value = event.target.getAttribute('value');

        onExpand && onExpand(value, event);
    }

    handleClick(onSelect, event) {
        var value = event.target.getAttribute('value');
        if (value) {
            onSelect && onSelect(value, event);
        }
    }

    handleDoubleClick(onDoubleClick, event) {
        var value = event.target.getAttribute('value');
        if (value) {
            onDoubleClick && onDoubleClick(value, event);
        }
    }

    // --------------------- 拖拽事件 ---------------------------

    handleDrag(event) {
        event.stopPropagation();
        this.currentDrag = event.currentTarget;
    }

    handleDragStart(event) {
        event.stopPropagation();
        event.dataTransfer.setData('text', 'foo');
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();

        var target = event.currentTarget;

        if (target === this.currentDrag) {
            return;
        }

        var area = event.offsetY / target.clientHeight;

        if (area < 0.25) {
            target.classList.add('dragTop');
        } else if (area > 0.75) {
            target.classList.add('dragBottom');
        } else {
            target.classList.add('drag');
        }
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();

        var target = event.currentTarget;

        if (target === this.currentDrag) {
            return;
        }

        target.classList.remove('dragTop');
        target.classList.remove('dragBottom');
        target.classList.remove('drag');
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        var target = event.currentTarget;

        if (target === this.currentDrag) {
            return;
        }

        target.classList.remove('dragTop');
        target.classList.remove('dragBottom');
        target.classList.remove('drag');

        if (typeof (this.onDrag) === 'function') {
            var area = event.offsetY / target.clientHeight;

            if (area < 0.25) { // 放在当前元素前面
                this.onDrag(
                    this.currentDrag.data, // 拖动要素
                    target.parentNode.parentNode.data, // 新位置父级
                    target.data, // 新位置索引
                ); // 拖动, 父级, 索引
            } else if (area > 0.75) { // 放在当前元素后面
                this.onDrag(
                    this.currentDrag.data,
                    target.parentNode.parentNode.data,
                    target.nextSibling == null ? null : target.nextSibling.data, // target.nextSibling为null，说明是最后一个位置
                );
            } else { // 成为该元素子级
                this.onDrag(
                    this.currentDrag.data,
                    target.data,
                    null,
                );
            }
        }
    }
}

Tree.propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    data: PropTypes.array,
    selected: PropTypes.string,
    onExpand: PropTypes.func,
    onSelect: PropTypes.func,
    onDoubleClick: PropTypes.func,
};

Tree.defaultProps = {
    className: null,
    style: null,
    data: [],
    selected: null,
    onExpand: null,
    onSelect: null,
    onDoubleClick: null,
};

export default Tree;