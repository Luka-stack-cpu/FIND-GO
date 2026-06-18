export class SafetyTooltip {
  private static activeTooltip: HTMLDivElement | null = null;

  public static attach(element: HTMLElement, text: string): void {
    element.style.position = 'relative';
    
    const showTooltip = () => {
      this.removeActive();

      const tooltip = document.createElement('div');
      tooltip.className = 'safety-tooltip-el';
      tooltip.textContent = text;
      
      // Append to body to avoid overflow issues, or as absolute child if preferred.
      // Appending to body is safer for boundary clipping, but let's place it on the body and compute absolute position.
      document.body.appendChild(tooltip);
      this.activeTooltip = tooltip;

      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      // Position top center of the element
      const top = rect.top + window.scrollY - tooltipRect.height - 8;
      let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);

      // Keep within screen bounds
      if (left < 10) {
        left = 10;
      } else if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
      
      // Trigger smooth entry
      requestAnimationFrame(() => {
        tooltip.classList.add('visible');
      });
    };

    const hideTooltip = () => {
      this.removeActive();
    };

    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
    element.addEventListener('focus', showTooltip);
    element.addEventListener('blur', hideTooltip);
  }

  private static removeActive(): void {
    if (this.activeTooltip) {
      const tooltip = this.activeTooltip;
      tooltip.classList.remove('visible');
      // Remove after animation finishes
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }, 200);
      this.activeTooltip = null;
    }
  }
}
