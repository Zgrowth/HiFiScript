import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FloatButton, Button,
  List, Modal, Empty,
  message, notification,
  Input, Select, Dropdown,
} from 'antd';
import './app.css';

const _unsafeWindow = typeof unsafeWindow != "undefined" ? unsafeWindow : window;

function App() {
  const [musicList, setMusicList, getMusicList] = useStateWithClosure(getList());
  const [songSheetList, setSongSheetList, getSongSheetList] = useLocalStorage('hifini_song_sheet_list', []); // 歌单数据源
  const [curIndex, setCurIndex, getCurIndex] = useStateWithClosure(-1);
  const [orderType, setOrderType] = useLocalStorage('hifini_play_list2_order_type', 'order');
  const [sheetValue, setSheetValue] = useState(''); // 新建歌单的歌单名称
  const [sheetMusicValue, setSheetMusicValue] = useState([]); // 新建歌单选择的歌曲
  const [isInSheet, setIsInSheet] = useState(false); // 是否在歌单管理界面
  const [curSheetName, setCurSheetName, getCurSheetName] = useStateWithClosure(''); // 当前进入的歌单名称
  const [curSheetMusic, setCurSheetMusic] = useState([]); // 当前进入的歌单歌曲列表
  const [curPlaySheet, setCurPlaySheet, getCurPlaySheet] = useLocalStorage('hifini_save_play_sheet_name', ''); // 存储当前播放的歌单名称
  const [saveSheetMusic, setSaveSheetMusic, getSaveSheetMusic] = useLocalStorage('hifini_save_play_sheet_list', []); // 存储播放的歌单歌曲列表
  const [visible, setVisible] = useState(false);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const realSheetCurIndex = useMemo(() => {
    let index = -1;
    const result = saveSheetMusic;
    if (location.pathname !== '/') {
      index = result.findIndex(i => (i.href || '').includes(location.pathname));
    }
    if (curSheetName !== curPlaySheet) {
      index = -1;
    }
    return index;
  }, [curSheetName, curPlaySheet, saveSheetMusic]);

  function useStateWithClosure(initialValue) {
    const [state, setState] = useState(initialValue);
    const stateRef = useRef(state);

    useEffect(() => {
      stateRef.current = state;
    }, [state]);

    const updateState = (newState) => {
      if (typeof newState === 'function') {
        setState((prevState) => {
          const updatedState = newState(prevState);
          stateRef.current = updatedState;
          return updatedState;
        });
      } else {
        setState(newState);
        stateRef.current = newState;
      }
    };

    const getState = () => {
      return stateRef.current;
    }

    return [state, updateState, getState];
  }

  function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    });

    // Function to set the localStorage and state
    const setValue = useCallback((value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(error);
      }
    }, [key, storedValue]);

    // Function to get the current value from localStorage
    const getValue = useCallback(() => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    }, [key, initialValue]);

    return [storedValue, setValue, getValue];
  }

  function getList() {
    const result = [];
    try {
      result.push(...JSON.parse(localStorage.getItem('hifini_play_list')));
    } catch (err) {
      return result;
    }
    return result;
  }

  function addSongSheet() {
    // 尝试添加歌单，如果歌单列表为空，则创建一个新的歌单并添加到歌单列表中，否则提示歌单已存在。
    try {
      if (!sheetValue) {
        message.error('歌单名称不能为空');
        return;
      }
      const sheetList = songSheetList;
      if (sheetList.find(i => i.name === sheetValue)) {
        message.error('歌单已存在');
        return;
      }
      sheetList.push({ name: sheetValue, children: sheetMusicValue });
      setSongSheetList(sheetList);
      setSheetValue('');
      setSheetMusicValue([]);
      setAddSheetVisible(false);
      // 插入下载、下一首、添加到播放列表按钮
      insertOperatorBtn(true);
      message.success('添加歌单成功');
    } catch (err) {
      message.error('添加歌单失败');
    }
  }

  // 添加到播放列表
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
        if (subjectEle.children[0].innerText.includes('mp3') || subjectEle.children[0].innerText.includes('MP3')) {
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
        }
      })
    } catch (error) {
      console.log("插入'添加到播放列表'按钮失败:", error);
      alert("插入'添加到播放列表'按钮失败");
    }
  }

  // 开始播放
  function handleStartPlay() {
    const sheetList = getSaveSheetMusic();
    const realMusicList = sheetList.length ? sheetList : getMusicList();
    if (!realMusicList.length) {
      return;
    }
    const realIndex = sheetList.length ? getSheetCurIndex() : getCurIndex();
    console.log('realIndex:', realIndex);
    // 根据顺序来开始播放
    if (orderType === 'order') {
      if (realIndex === realMusicList.length - 1) {
        setCurIndex(0);
        location.href = realMusicList[0].href;
      } else if (realIndex < 0) {
        setCurIndex(0);
        location.href = realMusicList[0].href;
      } else {
        setCurIndex(realIndex + 1);
        location.href = realMusicList[realIndex + 1].href;
      }
    } else {
      const randomIndex = Math.floor(Math.random() * realMusicList.length);
      console.log('随机到索引:', randomIndex);
      setCurIndex(randomIndex);
      location.href = realMusicList[randomIndex].href;
    }
  }

  function getSheetCurIndex() {
    let index = -1;
    const result = getSaveSheetMusic();
    if (location.pathname !== '/') {
      index = result.findIndex(i => (i.href || '').includes(location.pathname));
    }
    return index;
  }

  // 插入下载、下一首、添加到播放列表按钮
  function insertOperatorBtn(flag) {
    try {
      if (flag) {
        // 移除节点重新添加
        const ele = document.querySelector('.zs-play-list-item-operator');
        ele.parentElement.removeChild(ele);
      }
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
            {
              getSongSheetList()?.length ? (
                <Dropdown
                  menu={{
                    items: getSongSheetList().map(it => {
                      return { key: it.name, label: `【${it.name}】` };
                    }),
                    onClick: ({ key }) => {
                      const href = location.href;
                      const name = document.querySelector('.media-body h4').innerText;
                      handleAddSongToSheet(key, { href, name });
                    }
                  }}
                  placement="bottomLeft"
                  arrow
                  trigger={['click']}
                >
                  <Button
                    style={{ marginLeft: 8 }}
                    type='primary'
                    size='small'
                  >
                    添加到歌单
                  </Button>
                </Dropdown>
              ) : null
            }
          </div>
        </div>
      );
    } catch (err) {
      console.log('insertOperatorBtn error:', err || err.message);
    }
  }

  // 到达音乐播放页自动播放
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
        if (err && err.code === 9 && err.name === 'NotSupportedError') {
          notification.open({
            message: '温馨提示',
            type: 'warning',
            description: '该歌曲未能加载，因为找不到支持的源。即将播放下一首！！',
            onClose: () => {
              handleStartPlay();
            },
          });
        } else if (err && err.name === 'NotAllowedError') {
          notification.open({
            message: '温馨提示',
            type: 'warning',
            description: `由于浏览器策略不同，可能不允许脚本驱动媒体播放，可以手动点击播放音乐按钮，次数多了浏览器会记住你的选择，则脚本驱动媒体播放不会再失败。
        您也可以手动开启浏览器对声音的设置，将该网站设置为允许播放声音。`,
          });
        }
      });
      _unsafeWindow.ap4.audio.addEventListener('ended', function () {
        console.log('监听到播放结束');
        _unsafeWindow.ap4.audio.pause();
        handleStartPlay();
      }, false);
    } catch (err) {
      console.log('handleAutoPlay error:', err || err.message);
      handleAutoPlay();
    }
  }

  // 新建歌单
  function handleAddSongSheet() {
    setAddSheetVisible(true);
  }

  function handleDelSheetMusic(item, index) {
    const realList = getSongSheetList();
    const sheetItem = realList.find(i => i.name === curSheetName);
    sheetItem.children = sheetItem.children.filter(i => i.value !== item.href);
    if (curSheetName === curPlaySheet) {
      setSaveSheetMusic((pre) => {
        return pre.filter(i => i.name !== item.name);
      });
    }
    setCurSheetMusic((pre) => {
      return pre.filter(i => i.name !== item.name);
    });
    console.log('realList:', realList);
    setSongSheetList(realList);
  }

  function renderListItem(item, index) {
    if (curSheetName) {
      return renderListItemInside(item, index);
    }
    return renderListItemOutside(item, index);
  }

  function renderListItemInside(item, index) {
    return (
      <List.Item
        actions={[<Button
          onClick={(e) => {
            e.stopPropagation();
            handleDelSheetMusic(item, index);
          }}
          size='small'
          type="link"
          danger
        >
          删除
        </Button>]}
        styles={{
          padding: '0px 10px',
        }}
        onClick={() => {
          setCurPlaySheet(curSheetName);
          setSaveSheetMusic(curSheetMusic);
          location.href = item.href;
        }}
      >
        <span className={realSheetCurIndex === index ? 'zs-play-list-item zs-play-list-item-active' : 'zs-play-list-item'}>{item.name}</span>
      </List.Item>
    );
  }

  function renderListItemOutside(item, index) {
    return (
      <List.Item
        actions={[<Button
          onClick={(e) => {
            e.stopPropagation();
            const href = item?.children?.[0]?.value;
            if (href) {
              location.href = href;
              setCurPlaySheet(item.name);
              setSaveSheetMusic((item.children || []).map(it => {
                return {
                  name: it.label,
                  href: it.value,
                }
              }));
            } else {
              message.error('歌单内歌曲为空')
            }
          }}
          size='small'
          type="link"
        >
          播放
        </Button>, <Button
          onClick={(e) => {
            e.stopPropagation();
            if (item.name === curPlaySheet) {
              setCurPlaySheet('');
              setSaveSheetMusic([]);
            }
            setSongSheetList(songSheetList.filter(i => i.name !== item.name))
            setTimeout(() => {
              // 插入下载、下一首、添加到播放列表按钮
              insertOperatorBtn(true);
            }, 100);
          }}
          size='small'
          type="link"
          danger
        >
          删除
        </Button>]}
        styles={{
          padding: '0px 10px',
        }}
        onClick={() => {
          setCurSheetName(item.name);
          setCurSheetMusic((item.children || []).map(it => {
            return {
              name: it.label,
              href: it.value,
            }
          }));
        }}
      >
        <span className={curPlaySheet === item.name ? 'zs-play-list-item zs-play-list-item-active' : 'zs-play-list-item'}>{item.name}（{item?.children?.length || 0}）</span>
      </List.Item>
    );
  }

  // 添加歌曲到歌单
  function handleAddSongToSheet(sheetName, data = {}) {
    const realList = getSongSheetList();
    const sheetItem = realList.find(i => i.name === sheetName);
    if (sheetItem.children.find(i => i.value === data.href)) {
      message.error('歌单已存在该歌曲');
      return;
    }
    sheetItem.children.push({
      label: data.name,
      value: data.href,
    });
    if (getCurSheetName() === sheetName) {
      setCurSheetMusic((pre) => {
        const result = pre.concat([data]);
        return result;
      });
    }
    if (getCurPlaySheet() === sheetName) {
      setSaveSheetMusic((pre) => {
        const result = pre.concat([data]);
        return result;
      });
    }
    console.log('realList:', realList);
    setSongSheetList(realList);
    message.success('添加歌曲成功');
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

  useFirstUpdate(() => {
    const ele = document.querySelector('#player4');
    if (ele) {
      console.log('到达了播放页面');
      handleAutoPlay();
    }
  }, []);

  useEffect(() => {
    if (!saveSheetMusic.length) {
      const result = getList();
      if (location.pathname !== '/') {
        const index = result.findIndex(i => (i.href || '').includes(location.pathname));
        setCurIndex(index);
      }
    } else {
      setCurIndex(-1);
    }
  }, [musicList, saveSheetMusic]);

  useFirstUpdate(() => {
    setInsertAddList();
  }, []);

  useEffect(() => {
    if (curPlaySheet) {
      setIsInSheet(true);
      setCurSheetName(curPlaySheet);
      setCurSheetMusic(saveSheetMusic);
    }
  }, []);

  return (
    <div className="App">
      {contextHolder}
      <Modal
        title={isInSheet ? '歌单管理' : '播放列表'}
        open={visible}
        footer={null}
        width={640}
        maskClosable={false}
        onCancel={() => setVisible(false)}
      >
        {
          isInSheet ? (
            <List
              style={{ border: '1px solid #f5f5f5' }}
              itemLayout="horizontal"
              size='small'
              dataSource={curSheetName ? curSheetMusic : songSheetList}
              locale={{
                emptyText: <div>
                  <Empty
                    description={curSheetName ? "暂无歌曲，请先添加歌曲到歌单" : "暂无歌单，请先新建"}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              }}
              renderItem={renderListItem}
              header={<div style={{ padding: '0 16px' }}>
                <Button onClick={() => handleAddSongSheet()} type='primary' size='small'>
                  新建歌单
                </Button>
                <Button onClick={() => {
                  setCurSheetName('');
                  setIsInSheet(false);
                }} style={{ marginLeft: 8 }} size='small'>
                  返回播放列表
                </Button>
                {
                  curSheetName ? (
                    <Button onClick={() => setCurSheetName('')} style={{ marginLeft: 8 }} size='small'>
                      返回歌单列表
                    </Button>
                  ) : null
                }
                {
                  curPlaySheet ? (
                    <div style={{ display: 'inline-flex', marginLeft: 16, color: '#666' }}>
                      当前播放歌单：
                      <span style={{ color: '#333', fontWeight: 500 }}>{curPlaySheet}</span>
                    </div>
                  ) : null
                }
              </div>}
            />
          ) : (
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
                    setCurPlaySheet('');
                    setSaveSheetMusic([]);
                  }}
                >
                  <span className={curIndex === index ? 'zs-play-list-item zs-play-list-item-active' : 'zs-play-list-item'}>{item.name}</span>
                </List.Item>
              )}
              header={<div style={{ padding: '0 16px' }}>
                <Button onClick={() => {
                  setCurPlaySheet('');
                  setSaveSheetMusic([]);
                  handleStartPlay();
                }} type='primary' size='small'>
                  开始播放
                </Button>
                <Button onClick={() => setOrderType(orderType === 'order' ? 'random' : 'order')} style={{ marginLeft: 8 }} size='small'>
                  {orderType === 'order' ? '随机播放' : '顺序播放'}
                </Button>
                <Button onClick={() => setListAll([])} style={{ marginLeft: 8 }} size='small'>
                  清空列表
                </Button>
                <Button onClick={() => setIsInSheet(true)} style={{ marginLeft: 8 }} size='small'>
                  歌单管理
                </Button>
              </div>}
            />
          )
        }
      </Modal>
      <Modal
        title='新建歌单'
        open={addSheetVisible}
        width={340}
        maskClosable={false}
        onOk={() => {
          addSongSheet();
        }}
        okText='确定'
        cancelText='取消'
        centered
        onClose={() => setAddSheetVisible(false)}
        onCancel={() => setAddSheetVisible(false)}
      >
        <Input
          allowClear
          maxLength={20}
          style={{ width: '100%' }}
          placeholder='请输入歌单名称'
          value={sheetValue}
          onChange={(e) => setSheetValue(e.target.value)}
        />
        <Select
          mode="multiple"
          allowClear
          style={{ width: '100%', marginTop: 16 }}
          placeholder="可从播放列表选择歌曲到歌单"
          value={sheetMusicValue}
          onChange={v => setSheetMusicValue(v)}
          labelInValue
          optionFilterProp="name"
          fieldNames={{ label: 'name', value: 'href' }}
          options={musicList}
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
