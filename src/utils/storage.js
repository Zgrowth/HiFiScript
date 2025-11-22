// 获取播放列表
export function getList() {
  const result = [];
  try {
    result.push(...JSON.parse(localStorage.getItem('hifiti_play_list')));
  } catch (err) {
    return result;
  }
  return result;
}

// 导出数据到JSON文件
export function exportToJsonFile(data) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hifiti导出.json';
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}
