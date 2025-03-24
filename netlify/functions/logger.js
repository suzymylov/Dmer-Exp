const fs = require('fs');
const path = require('path');

// 简单的日志记录函数
function logToFile(message) {
  try {
    // 在Netlify函数中，我们可能无法写入文件系统，所以只进行控制台记录
    console.log(message);
  } catch (error) {
    console.error('日志记录错误:', error);
  }
}

module.exports = { logToFile }; 