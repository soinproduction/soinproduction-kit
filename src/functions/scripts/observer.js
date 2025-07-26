class AnchorObserver {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.4
    this.anchorSelector = options.anchorSelector
    this.sectionSelector = options.sectionSelector
    this.activeClass = options.activeClass || 'active'

    this.observer = null
    this.initObserver()
    this.observeSections()
  }

  initObserver() {
    this.observer = new IntersectionObserver(this.handleIntersect.bind(this), {
      threshold: this.threshold,
    })
  }

  handleIntersect(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const targetId = entry.target.id
        document.querySelectorAll(this.anchorSelector).forEach((link) => {
          const linkHref = link.getAttribute('href')?.replace('#', '')
          if (linkHref === targetId) {
            link.classList.add(this.activeClass)
          } else {
            link.classList.remove(this.activeClass)
          }
        })
      }
    })
  }

  observeSections() {
    document.querySelectorAll(this.sectionSelector).forEach((section) => {
      this.observer.observe(section)
    })
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }

  reinit() {
    this.disconnect()
    this.initObserver()
    this.observeSections()
  }
}

export default AnchorObserver
