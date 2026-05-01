const getBaseUrl = () => {
  // 检测是否在 Capacitor Android 环境中
  if (typeof window !== 'undefined' && window.Capacitor) {
    const platform = window.Capacitor.getPlatform?.() || ''
    // Android 模拟器使用 10.0.2.2 访问宿主机
    // Android 真机请确保服务器在同一局域网，并修改为实际 IP
    if (platform === 'android') {
      return 'http://10.0.2.2:8000'
    }
    if (platform === 'ios') {
      return 'http://localhost:8000'
    }
  }
  // 浏览器环境
  return 'http://localhost:8000'
}

const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 30000,
  TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token'
}

export default API_CONFIG