import {disableScroll} from "../functions/disable-scroll.js";
import {enableScroll} from "../functions/enable-scroll.js";

export class AdditionalToggle {
  constructor({ items = [], overlay = null, activeClass = 'active' }) {
    this.itemsConfig = items
    this.overlaySelector = overlay
    this.activeClass = activeClass

    this.boundClickHandler = null
    this.boundOverlayHandler = null

    this.reinit()
  }

  getElement(ref) {
    if (!ref) return null
    if (typeof ref === 'string') return document.querySelector(ref)
    if (ref instanceof HTMLElement) return ref
    return null
  }

  getElements(ref) {
    if (!ref) return []
    if (typeof ref === 'string') return [...document.querySelectorAll(ref)]
    if (ref instanceof HTMLElement) return [ref]
    if (NodeList.prototype.isPrototypeOf(ref) || Array.isArray(ref)) {
      return [...ref].filter((el) => el instanceof HTMLElement)
    }
    return []
  }

  addClass(el) {
    el?.classList.add(this.activeClass)
  }

  removeClass(el) {
    el?.classList.remove(this.activeClass)
  }

  isActive(el) {
    return el?.classList.contains(this.activeClass)
  }

  anyActive(instances) {
    return instances.some(({ target }) => this.isActive(target))
  }

  closeAll(instances) {
    instances.forEach(({ trigger, target }) => {
      this.removeClass(target)
      trigger.forEach((t) => this.removeClass(t))
    })
    if (this.overlay) this.removeClass(this.overlay)

    enableScroll()
  }

  removeGlobalHandlers() {
    if (this.boundClickHandler) {
      document.removeEventListener('click', this.boundClickHandler)
      this.boundClickHandler = null
    }
    if (this.overlay && this.boundOverlayHandler) {
      this.overlay.removeEventListener('click', this.boundOverlayHandler)
      this.boundOverlayHandler = null
    }
  }

  reinit() {
    this.removeGlobalHandlers()

    this.overlay = this.getElement(this.overlaySelector)

    this.instances = this.itemsConfig.map((item) => {
      const trigger = this.getElements(item.trigger)
      const target = this.getElement(item.target)
      const close = this.getElements(item.close)

      return { trigger, target, close }
    })

    this.instances.forEach(({ trigger, target, close }) => {
      if (!target || !trigger.length) return

      trigger.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()

          const isOpen = this.isActive(target)
          this.closeAll(this.instances)

          if (!isOpen) {
            this.addClass(target)
            trigger.forEach((t) => this.addClass(t))
            if (this.overlay) this.addClass(this.overlay)
          }
          disableScroll()
        })
      })

      close.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault()
          this.removeClass(target)
          trigger.forEach((t) => this.removeClass(t))
          if (this.overlay && !this.anyActive(this.instances)) {
            this.removeClass(this.overlay)
            enableScroll()
          }
        })
      })
    })

    this.boundClickHandler = (e) => {
      this.instances.forEach(({ trigger, target }) => {
        const outsideTarget = !target?.contains(e.target)
        const outsideTrigger = trigger.every((t) => !t.contains(e.target))

        if (outsideTarget && outsideTrigger) {
          this.removeClass(target)
          trigger.forEach((t) => this.removeClass(t))
          if (this.overlay && !this.anyActive(this.instances)) {
            this.removeClass(this.overlay)
          }
        }
      })
    }
    document.addEventListener('click', this.boundClickHandler)

    if (this.overlay) {
      this.boundOverlayHandler = (e) => {
        if (e.target === this.overlay) {
          this.closeAll(this.instances)
        }
      }
      this.overlay.addEventListener('click', this.boundOverlayHandler)
    }
  }
}

if (typeof window !== 'undefined') {
  window.AdditionalToggle = AdditionalToggle
}
