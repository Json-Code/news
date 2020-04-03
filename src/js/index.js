import '../scss/index.scss';

import Header from '../components/header';
import Nav from '../components/nav';
import NewsItem from '../components/news_item';
import PageLoading from '../components/page_loading';
import BottomTip from '../components/bottom_tip'

import { IndexModel } from '../models/index'

import data from '../utils/data'
import tools from '../utils/tools'

const header = new Header(),
      nav = new Nav(),
      newsItem = new NewsItem(),
      pageLoading = new PageLoading(),
      bottomTip = new BottomTip()

const indexModel = new IndexModel()

const App = ($, win) => {

  const $app = $('#app'),
        $window = $(win),
        $list = $app.children('.list'),
        newScrollToBottom = tools.scrollToBottom.bind(null, scrollToBottom)

  let field = 'top',
      pageNum = 0,
      pageCount = 0,
      showCount = 10,
      dataCache = {},
      bottomLock = false

  const init = () => {
    render(field, pageNum, showCount).then(bindEvent)
  }

  const render = (field, pageNum, showCount) => {
    return new Promise((resolve, reject) => {
      _renderHeader();
      _renderNav(data.news_type);
      _renderList(field, pageNum, showCount)
      resolve()
    })
  }

  const bindEvent = () => {
    $('.nav .nav-wrapper').on('click', '.item', navSelect)
    $list.on('click', '.news-item', toDetailPage)
  }

  const _renderHeader = () => {
    $app.append(header.tpl({
      title: "新闻头条",
      showLeftIcon: false,
      showRightIcon: true
    }))
  }

  const _renderNav = (newsType) => {
    const tpls = nav.tpl(newsType);
    $app.append(tpls.navStr);
    $('.nav .nav-wrapper').append(tpls.itemsStr);
  }

  const _renderList = (field, pageNum, showCount) => {
    if (dataCache[field]) {
      pageCount = dataCache[field].length;
      _insertList('cover')
    } else {
      _handlePageLoading('append')
      indexModel.getNewsList(field, showCount).then((res) => {
        dataCache[field] = res
        pageCount = dataCache[field].length;
        _insertList('cover')
      })
    }
  }

  const _insertList = (method) => {
    switch (method) {
      case 'cover':
        $list.html(newsItem.tpl(dataCache[field][pageNum], pageNum))
        _scrollToTop()
        _handlePageLoading('remove')
        _afterRender(true)
        break;
      
      case 'append':
        $list.append(newsItem.tpl(dataCache[field][pageNum], pageNum))
        _afterRender(false)
        break;
    }
    bottomLock = false
    _handleBottomTip('remove')
  }

  const _afterRender = (bindScroll) => {
    bindScroll && _handleScrollEvent(true)
    tools.thumbShow($('.news-thumb'))
  }

  const _handlePageLoading = (how) => {
    switch (how) {
      case 'append':
        $list.html('');
        $app.append(pageLoading.tpl());
        break;
      case 'remove':
        $('.loading-icon').remove();
        break;
      default:
        break
    }
  }

  const _handleBottomTip = (how, isLoading, text) => {
    switch (how) {
      case 'append':
        $app.append(bottomTip.tpl(isLoading, text));
        break;
      case 'remove':
        $('.bottom-tip').remove();
        break;
      case 'removeAndAppend':
        $('.bottom-tip').remove();
        $app.append(bottomTip.tpl(isLoading, text));
    }
  }

  const _scrollToTop = () => {
    setTimeout(() => win.scrollTo(0, 0), 150)
  }

  const _handleScrollEvent = (isBind) => {
    isBind ? $window.on('scroll', newScrollToBottom)
           : $window.off('scroll', newScrollToBottom)
  }

  function navSelect () {
    pageNum = 0
    _handleBottomTip('remove')
    _scrollToTop()
    _handleScrollEvent(false)
    const $this = $(this)
    field = $this.attr('data-type')
    $this.addClass('current').siblings('.item').removeClass('current')
    _renderList(field, pageNum, showCount)
  }

  function scrollToBottom () {
    if (pageNum < pageCount - 1) {
      if (!bottomLock) {
        bottomLock = true
        _handleBottomTip('append', 'loading', '正在努力加载中')

        setTimeout(() => {
          pageNum++;
          _insertList('append')
        }, 2000)
      }
    } else {
      _handleBottomTip('removeAndAppend', 'final', '已加载完所有内容')
    }
  }

  function toDetailPage () {
    const $this = $(this),
          url = $this.attr('data-url'),
          idx = $this.attr('data-index'),
          pageNum = $this.attr('data-page');

    localStorage.setItem('target', JSON.stringify(dataCache[field][pageNum][idx]))
    window.location.href = `detail.html?news_url=${url}&&uniquekey=${dataCache[field][pageNum][idx].uniquekey}`
  }

 init()
}

App(Zepto, window)