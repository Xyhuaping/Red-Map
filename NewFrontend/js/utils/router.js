export class HashRouter {
  constructor() {
    this.routes = new Map()
    this.currentRoute = null
    this.beforeHooks = []
    this.afterHooks = []
    
    window.addEventListener('hashchange', () => this.handleHashChange())
    window.addEventListener('popstate', (event) => {
      event.preventDefault()
      this.handleHashChange()
    })
  }

  addRoute(path, handler) {
    this.routes.set(path, handler)
    return this
  }

  navigate(path, params = {}) {
    const queryString = Object.keys(params).length > 0
      ? '?' + new URLSearchParams(params).toString()
      : ''
    
    const hash = path + queryString
    window.location.hash = hash
  }

  getCurrentRoute() {
    return this.parseHash(window.location.hash)
  }

  parseHash(hash) {
    const hashWithoutPrefix = hash.replace('#', '')
    const [pathPart, queryPart] = hashWithoutPrefix.split('?')
    const path = pathPart || '/'
    const params = {}

    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart)
      for (const [key, value] of searchParams.entries()) {
        params[key] = value
      }
    }

    return { path, params }
  }

  async handleHashChange() {
    const route = this.getCurrentRoute()

    if (!route.path || route.path === '/') {
      route.path = '/'
    }

    for (const hook of this.beforeHooks) {
      await hook(route, this.currentRoute)
    }

    const handler = this.routes.get(route.path)

    if (handler) {
      try {
        await handler(route.params)
        this.currentRoute = route
        
        for (const hook of this.afterHooks) {
          await hook(route)
        }
      } catch (error) {
        console.error('Router error:', error)
        this.navigate('/')
      }
    } else {
      console.warn(`No route found for: ${route.path}`)
      this.navigate('/')
    }
  }

  beforeEach(hook) {
    this.beforeHooks.push(hook)
  }

  afterEach(hook) {
    this.afterHooks.push(hook)
  }

  start(initialPath = '/') {
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = initialPath
    } else {
      this.handleHashChange()
    }
  }

  back() {
    window.history.back()
  }

  forward() {
    window.history.forward()
  }
}

export default HashRouter