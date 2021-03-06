import React from 'react';
import PropTypes from 'prop-types';
import { Motion, spring, presets } from 'react-motion';
import Measure from 'react-measure';
import styled from 'styled-components';
import range from 'lodash/range';
import PlaceholderCarousel from './PlaceholderCarousel';
import {
  calculateItemWidth,
  calculateItemLeftGutter,
  calculateItemRightGutter,
  calculateTranslateX,
  showLeftChevron,
  showRightChevron,
  calculateNextIndex,
  calculatePreviousIndex,
} from './helpers';

const CarouselWrapper = styled.div`
  position: relative;
  /* This is necessary to hide scrollbars in free scrolling mode */
  ${(props) => props.freeScrolling && `overflow: hidden;`}
  ${(props) => props.height && `height: ${props.height}px;`}
`;

const Wrapper = styled.div`
  width: 100%;
  overflow-x: ${(props) => props.freeScrolling ? 'scroll' : 'hidden'};
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const SliderItemsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  transform: translateX(-${(props) => props.translateX}px);
`;

const SliderItem = styled.div`
  width: ${(props) => props.width}px;
  flex-shrink: 0;
  margin-right: ${(props) => props.last ? 0 : props.rightGutter}px;
  margin-left: ${(props) => props.first ? 0 : props.leftGutter}px;
`;

const CarouselChevron = styled.div`
  position: absolute;
  height: 100%;
  width: ${(props) => props.chevronWidth + 1}px;
  cursor: pointer;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MarginHolder = styled.div`
  width: ${(props) => props.width}px;
  height: 10px;
  flex-shrink: 0;
`;

const CarouselRightChevron = styled(CarouselChevron)`
  right: -${(props) => props.outsideChevron ? props.chevronWidth : 0}px;
`;

const CarouselLeftChevron = styled(CarouselChevron)`
  left: -${(props) => props.outsideChevron ? props.chevronWidth : 0}px;
`;

class ItemsCarousel extends React.Component {
  componentWillMount() {
    this.setState({
      containerWidth: this.props.containerWidth || 0,
      isPlaceholderMode: this.props.enablePlaceholder && this.props.children.length === 0,
    });

    this.startPlaceholderMinimumTimer();
  }

  componentWillUnmount() {
    if(this.placeholderTimer) {
      clearTimeout(this.placeholderTimer);
    }
  }


  componentWillReceiveProps(nextProps) {
    // Data loaded and no timer to deactivate placeholder mode
    if(nextProps.children.length > 0 && this.props.children.length === 0 && !this.placeholderTimer) {
      this.setState({ isPlaceholderMode: false });
    }
  }

  startPlaceholderMinimumTimer = () => {
    if(! this.props.minimumPlaceholderTime) {
      return;
    }

    this.placeholderTimer = setTimeout(() => {
      this.placeholderTimer = null;
      if(this.props.children.length > 0) {
        this.setState({ isPlaceholderMode: false });
      }
    }, this.props.minimumPlaceholderTime);
  }

  getInitialFrame = ({ translateX }) => ({
    translateX,
  });

  calculateNextFrame = ({ translateX, springConfig }) => ({
    translateX: spring(translateX, springConfig),
  });

  renderList({ translateX }) {
    const {
      gutter,
      freeScrolling,
      numberOfCards,
      firstAndLastGutter,
      children,
      showSlither,
    } = this.props;

    const {
      containerWidth,
      containerHeight,
    } = this.state;
    const width = calculateItemWidth({
      firstAndLastGutter,
      containerWidth,
      gutter,
      numberOfCards,
      showSlither,
    });

    return (
      <Wrapper
        freeScrolling={freeScrolling}
      >
        <Measure
          includeMargin={false}
          whitelist={['width', 'height']}
          onMeasure={({ width, height }) => {
            this.setState({ containerWidth: width, containerHeight: height });
          }}
        >
          <SliderItemsWrapper
            translateX={translateX}
          >
            {
              firstAndLastGutter ?
              <MarginHolder
                width={2 * gutter}
              /> : null
            }
            {children.map((child, index) => (
              <SliderItem
                key={index}
                first={index === 0}
                last={index == child.length - 1}
                width={width}
                leftGutter={calculateItemLeftGutter({
                  index,
                  firstAndLastGutter,
                  gutter,
                })}
                rightGutter={calculateItemRightGutter({
                  index,
                  firstAndLastGutter,
                  gutter,
                  numberOfChildren: children.length,
                })}
              >
                { React.cloneElement(child, { width })}
              </SliderItem>
            ))}
            {
              firstAndLastGutter ?
              <MarginHolder
                width={2 * gutter}
              /> : null
            }
          </SliderItemsWrapper>
        </Measure>
      </Wrapper>
    );
  }

  render() {
    const {
      gutter,
      freeScrolling,
      numberOfCards,
      firstAndLastGutter,
      children,
      activeItemIndex,
      activePosition,
      springConfig,
      showSlither,
      rightChevron,
      leftChevron,
      chevronWidth,
      outsideChevron,
      requestToChangeActive,
      slidesToScroll,
      ...props,
    } = this.props;

    const {
      containerWidth,
      containerHeight,
      isPlaceholderMode,
    } = this.state;

    if(isPlaceholderMode) {
      return <PlaceholderCarousel {...this.props} />
    }

    if(freeScrolling) {
      return (
        <CarouselWrapper
          freeScrolling={freeScrolling}
          height={containerHeight}
          {...props}
        >
          {this.renderList({ translateX: 0, addHack: true })}
        </CarouselWrapper>
      )
    }

    const translateX = calculateTranslateX({
      activeItemIndex,
      activePosition,
      containerWidth,
      numberOfChildren: children.length,
      numberOfCards,
      gutter,
      firstAndLastGutter,
      showSlither,
    });

    const _showRightChevron = rightChevron && showRightChevron({
      activeItemIndex,
      activePosition,
      numberOfChildren: children.length,
      numberOfCards,
      slidesToScroll,
    });

    const _showLeftChevron = leftChevron && showLeftChevron({
      activeItemIndex,
      activePosition,
      numberOfChildren: children.length,
      numberOfCards,
      slidesToScroll,
    });

    return (
      <CarouselWrapper {...props}>
        <Motion
          defaultStyle={this.getInitialFrame({ translateX, springConfig })}
          style={this.calculateNextFrame({ translateX, springConfig })}
          children={({ translateX }) => this.renderList({ translateX })}
        />
        {
          _showRightChevron && 
          <CarouselRightChevron
            chevronWidth={chevronWidth}
            outsideChevron={outsideChevron}
            onClick={() => requestToChangeActive(calculateNextIndex({
              activePosition,
              activeItemIndex,
              numberOfCards,
              slidesToScroll,
              numberOfChildren: children.length,
            }))}
          >
            {rightChevron}
          </CarouselRightChevron>
        }
        {
          _showLeftChevron && 
          <CarouselLeftChevron
            chevronWidth={chevronWidth}
            outsideChevron={outsideChevron}
            onClick={() => requestToChangeActive(calculatePreviousIndex({
              activePosition,
              activeItemIndex,
              numberOfCards,
              slidesToScroll,
              numberOfChildren: children.length,
            }))}
          >
            {leftChevron}
          </CarouselLeftChevron>
        }
      </CarouselWrapper>
    );
  }
}

ItemsCarousel.propTypes = {
  containerWidth: PropTypes.number,
  /**
   * Carousel react items.
   */
  children: PropTypes.arrayOf(PropTypes.element).isRequired,

  /**
   * Number of cards to show.
   */
  numberOfCards: PropTypes.number,

  /**
   * Space between carousel items.
   */
  gutter: PropTypes.number,

  /**
   * If true a slither of next item will be showed.
   */
  showSlither: PropTypes.bool,

  /**
   * If true first item will have twice the 
   */
  firstAndLastGutter: PropTypes.bool,

  /**
   * If true, free scrolling will be enabled.
   */
  freeScrolling: PropTypes.bool,

  /**
   * Enable placeholder items while data loads
   */
  enablePlaceholder: PropTypes.bool,

  /**
   * Placeholder item. Ignored if enablePlaceholder is false.
   */
  placeholderItem: PropTypes.element,

  /**
   * Number of placeholder items. Ignored if enablePlaceholder is false.
   */
  numberOfPlaceholderItems: PropTypes.number,

  /**
   * This is called when we want to change the active item.
   * Right now we will never call this unless a left or right chevrons are clicked.
   */
  requestToChangeActive: PropTypes.func,

  /**
   * This gives you the control to change the current active item.
   * This is ignored if freeScrolling is true.
   */
  activeItemIndex: PropTypes.number,

  /**
   * The active item position.
   * This is ignored if freeScrolling is true.
   */
  activePosition: PropTypes.oneOf([
    'left',
    'center',
    'right',
  ]),

  /**
   * Right chevron element. If passed `requestToChangeActive` must be set.
   */
  rightChevron: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.string,
  ]),

  /**
   * Left chevron element. If passed `requestToChangeActive` must be set.
   */
  leftChevron: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.string,
  ]),

  /**
   * Chevron width.
   */
  chevronWidth: PropTypes.number,

  /**
   * If true the chevron will be outside the carousel.
   */
  outsideChevron: PropTypes.bool,

  /**
   * Number of slides to scroll when clicked on right or left chevron.
   */
  slidesToScroll: PropTypes.number,

  /**
   * React motion configurations.
   * [More about this here](https://github.com/chenglou/react-motion#--spring-val-number-config-springhelperconfig--opaqueconfig)
   */
  springConfig: PropTypes.shape({
    stiffness: PropTypes.number,
    damping: PropTypes.number,
    precision: PropTypes.number,
  }),
};

ItemsCarousel.defaultProps = {
  numberOfCards: 3,
  gutter: 0,
  firstAndLastGutter: false,
  showSlither: false,
  freeScrolling: false,
  enablePlaceholder: false,
  activeItemIndex: 0,
  activePosition: 'left',
  slidesToScroll: 1,
};

export default ItemsCarousel;
