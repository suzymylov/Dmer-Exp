const { createServerHandler } = require('@netlify/next');

const handler = createServerHandler({
  // 你的Next.js应用程序的根目录
  dir: __dirname,
});

exports.handler = async (event, context) => {
  // 提取路径参数以便正确路由请求
  const path = event.path.replace('/.netlify/functions/api', '');
  event.path = path || '/';
  
  console.log('处理API请求:', event.path);
  
  return handler(event, context);
}; 