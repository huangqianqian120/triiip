export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { itinerary, gaodeKey, gaodeSecret } = req.body;

  // TODO: 解析itinerary，提取景点名，调用高德API获取坐标
  // 这里只做mock，返回高德地图首页或自定义跳转链接
  // 实际可根据景点名拼接uri.amap.com/marker等跳转格式
  const url = "https://www.amap.com/";

  res.status(200).json({ success: true, url });
} 