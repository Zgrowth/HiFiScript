// 通过className获取节点
export function getNodeByClassName(node, name) {
  for (let i = 0; i < node.length; i++) {
    if (node[i].className.split(' ').includes(name)) {
      return node[i];
    }
  }
}

// 获取播放器对象
export function getAuditObject() {
  try {
    return ap4;
  } catch (error) {
    return ap;
  }
}
