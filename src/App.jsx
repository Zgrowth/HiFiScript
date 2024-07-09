import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { FloatButton, Button, List, Modal, Empty, message } from 'antd';
import './app.css';

const _unsafeWindow = typeof unsafeWindow != "undefined" ? unsafeWindow  : window;

function App() {
  const [musicList, setMusicList] = useState(getList());
  const [curIndex, setCurIndex] = useState(-1);
  const [orderType, setOrderType] = useState(localStorage.getItem('hifini_play_list2_order_type') || 'order');
  const [visible, setVisible] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  function getList() {
    const result = [];
    try {
      result.push(...JSON.parse(localStorage.getItem('hifini_play_list')));
    } catch (err) {
      return result;
    }
    return result;
  }

  function addItemPlayList(data = {}) {
    const result = getList() || [];
    if (result.find(i => i.href === data.href)) {
      messageApi.open({
        type: 'warning',
        content: '播放列表已存在',
      });
      return;
    }
    result.push(data);
    setMusicList(result);
    messageApi.open({
      type: 'success',
      content: '添加成功',
    });
    localStorage.setItem('hifini_play_list', JSON.stringify(result));
  }

  function setListAll(data = []) {
    setMusicList(data);
    localStorage.setItem('hifini_play_list', JSON.stringify(data));
  }

  // 通过判断className获取节点
  function getNodeByClassName(node, name) {
    for (let i = 0; i < node.length; i++) {
      if (node[i].className.split(' ').includes(name)) {
        return node[i];
      }
    }
  }

  // 插入添加到播放列表按钮
  function setInsertAddList() {
    try {
      let ulEle = Array.from(document.querySelector('.card-body').children[0].children).filter(i => i.tagName === 'LI');
      if (location.href.indexOf('search') !== -1) {
        ulEle = Array.from(document.querySelector('.search .card-body').children[0].children).filter(i => i.tagName === 'LI');
      }
      ulEle.forEach(it => {
        const mediaEle = getNodeByClassName(it.children, 'media-body');
        const subjectEle = getNodeByClassName(mediaEle.children, 'subject');
        subjectEle.setAttribute('data-href', subjectEle.children[0].href);
        subjectEle.setAttribute('data-name', subjectEle.children[0].innerText);
        createRoot(subjectEle).render(
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div dangerouslySetInnerHTML={{ __html: subjectEle.innerHTML }} />
            <Button
              style={{ marginLeft: 8 }}
              type='primary'
              size='small'
              onClick={() => {
                console.log('_unsafeWindow:', _unsafeWindow);
                const href = subjectEle.dataset.href;
                const name = subjectEle.dataset.name;
                addItemPlayList({ href, name });
              }}
            >
              添加到播放列表
            </Button>
          </div>
        );
      })
    } catch (error) {
      console.log("插入'添加到播放列表'按钮失败:", error);
      alert("插入'添加到播放列表'按钮失败");
    }
  }

  function handleStartPlay() {
    if (!musicList.length) {
      return;
    }
    // 根据顺序来开始播放
    if (orderType === 'order') {
      if (curIndex === musicList.length - 1) {
        setCurIndex(0);
        location.href = musicList[0].href;
      } else if (curIndex < 0) {
        setCurIndex(0);
        location.href = musicList[0].href;
      } else {
        setCurIndex(curIndex + 1);
        location.href = musicList[curIndex + 1].href;
      }
    } else {
      const randomIndex = Math.floor(Math.random() * musicList.length);
      console.log('随机到索引:', randomIndex);
      setCurIndex(randomIndex);
      location.href = musicList[randomIndex].href;
    }
  }

  function insertOperatorBtn() {
    console.log('insertOperatorBtn start');
    try {
      const ele = document.querySelector('#player4 .aplayer-music');
      if (ele.innerHTML.includes('zs-play-list-item-operator')) return;
      createRoot(ele).render(
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div dangerouslySetInnerHTML={{ __html: ele.innerHTML }} />
          <div className='zs-play-list-item-operator'>
            <Button
              type='primary'
              size='small'
              onClick={() => {
                window.open(ap4.audio.src, '_blank');
              }}
            >
              下载
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              type='primary'
              size='small'
              onClick={() => handleStartPlay()}
            >
              下一首
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              type='primary'
              size='small'
              onClick={() => {
                const href = location.href;
                const name = document.querySelector('.media-body h4').innerText;
                addItemPlayList({ href, name });
              }}
            >
              添加到播放列表
            </Button>
          </div>
        </div>
      );
    } catch (err) {
      console.log('insertOperatorBtn error:', err || err.message);
    }
  }

  async function handleAutoPlay() {
    console.log('handleAutoPlay', _unsafeWindow);
    try {
      while (!_unsafeWindow.ap4) {
        console.log('window.ap4 is not available, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      // 插入下载、下一首、添加到播放列表按钮
      insertOperatorBtn();

      _unsafeWindow.ap4.audio.play().catch(err => {
        console.log('handleAutoPlay error:', err || err.message);
      });
      _unsafeWindow.ap4.audio.addEventListener('ended', function () {
        console.log('监听到播放结束');
        handleStartPlay();
      }, false);
    } catch (err) {
      console.log('handleAutoPlay error:', err || err.message);
      handleAutoPlay();
    }
  }

  function useFirstUpdate(fn, inputs) {
    const countRef = useRef(0);
    useEffect(() => {
      if (!countRef.current) {
        countRef.current++;
        fn()
      }
    }, inputs);
  }

  useEffect(() => {
    const ele = document.querySelector('#player4');
    if (ele) {
      console.log('到达了播放页面');
      handleAutoPlay();
    }
  }, []);

  useEffect(() => {
    const result = getList();
    if (location.pathname !== '/') {
      const index = result.findIndex(i => (i.href || '').includes(location.pathname));
      setCurIndex(index);
    }
  }, [musicList]);

  useFirstUpdate(() => {
    setInsertAddList();
  }, []);

  useEffect(() => {
    localStorage.setItem('hifini_play_list2_order_type', orderType || 'order');
  }, [orderType]);

  return (
    <div className="App">
      {contextHolder}
      <Modal
        title='播放列表'
        open={visible}
        footer={null}
        width={640}
        maskClosable={false}
        onCancel={() => setVisible(false)}
      >
        <List
          style={{ border: '1px solid #f5f5f5' }}
          itemLayout="horizontal"
          size='small'
          dataSource={musicList}
          locale={{
            emptyText: <div>
              <Empty
                description="暂无播放列表数据，请先添加"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          }}
          renderItem={(item, index) => (
            <List.Item
              actions={[<Button onClick={(e) => {
                e.stopPropagation();
                setListAll(musicList.filter(i => i.href !== item.href));
              }} size='small' type="link" danger>
                删除
              </Button>]}
              styles={{
                padding: '0px 10px',
              }}
              onClick={() => {
                location.href = item.href;
              }}
            >
              <span className={curIndex === index ? 'zs-play-list-item zs-play-list-item-active' : 'zs-play-list-item'}>{item.name}</span>
            </List.Item>
          )}
          header={<div style={{ padding: '0 16px' }}>
            <Button onClick={() => handleStartPlay()} type='primary' size='small'>
              开始播放
            </Button>
            <Button onClick={() => setOrderType(orderType === 'order' ? 'random' : 'order')} style={{ marginLeft: 8 }} size='small'>
              {orderType === 'order' ? '随机播放' : '顺序播放'}
            </Button>
            <Button onClick={() => setListAll([])} style={{ marginLeft: 8 }} size='small'>
              清空列表
            </Button>
          </div>}
        />
      </Modal>
      <FloatButton
        shape="circle"
        type="primary"
        style={{ left: '100px', bottom: '100px' }}
        onClick={() => setVisible(true)}
        icon={<img
          src='https://cdn.jsdelivr.net/gh/Zgrowth/image@master/20240704/music.4uat39g1wl.webp'
        />}
      />
    </div>
  );
}

export default App;
