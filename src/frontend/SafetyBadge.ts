import { SafetyTooltip } from './SafetyTooltip.js';

export class SafetyBadge {
  public static getInfo(score: number): { emoji: string; text: string; colorClass: string } {
    if (score >= 7.1) {
      return {
        emoji: '🟢',
        text: 'Низкий уровень риска. Обычно считается безопасным для посещения.',
        colorClass: 'safety-low'
      };
    } else if (score >= 4.1) {
      return {
        emoji: '🟠',
        text: 'Средний уровень риска. В целом место посещаемое, но стоит сохранять внимательность.',
        colorClass: 'safety-medium'
      };
    } else {
      return {
        emoji: '🔴',
        text: 'Высокий уровень риска. Рекомендуется соблюдать повышенную осторожность.',
        colorClass: 'safety-high'
      };
    }
  }

  public static create(score: number, showScore: boolean = true): HTMLElement {
    const info = this.getInfo(score);
    const badge = document.createElement('span');
    badge.className = `safety-badge ${info.colorClass}`;
    
    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'safety-emoji';
    emojiSpan.textContent = info.emoji;
    badge.appendChild(emojiSpan);

    if (showScore) {
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'safety-score-value';
      scoreSpan.textContent = ` ${score.toFixed(1)}/10`;
      badge.appendChild(scoreSpan);
    }

    // Attach custom tooltip to the emoji trigger
    SafetyTooltip.attach(emojiSpan, info.text);

    return badge;
  }

  public static getHtml(score: number, showScore: boolean = true): string {
    const info = this.getInfo(score);
    const scoreStr = showScore ? ` <span class="safety-score-value">${score.toFixed(1)}/10</span>` : '';
    // We can also let the window listener attach tooltips to any elements matching data-safety-tooltip
    return `<span class="safety-badge ${info.colorClass}" data-safety-score="${score}"><span class="safety-emoji" data-tooltip-text="${info.text}">${info.emoji}</span>${scoreStr}</span>`;
  }
}
