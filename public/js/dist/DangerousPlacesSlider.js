"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DangerousPlacesSlider = void 0;
const SafetyBadge_js_1 = require("./SafetyBadge.js");
class DangerousPlacesSlider {
    static render(places, containerId, onPlaceClick) {
        const container = document.getElementById(containerId);
        if (!container)
            return;
        // Filter to only include the requested dangerous places
        const dangerousNames = [
            'Арча-Бешик',
            'Asia Mall',
            'Торговый центр Азия Молл', // handle database name mismatch just in case
            'Рабочий городок',
            'Ынтымак',
            'Парк Ынтымак', // handle database name mismatch just in case
            'Аламедин-1',
            'Кызыл-Аскер'
        ];
        const filtered = places.filter(p => dangerousNames.some(name => p.name.toLowerCase().includes(name.toLowerCase())));
        if (!filtered.length) {
            container.innerHTML = `<div class="text-center text-muted w-100 py-5">😔 Нет опасных мест</div>`;
            return;
        }
        container.innerHTML = filtered.map(place => {
            const photos = place.photos || [place.img || ''];
            const slides = photos.map((url) => `
        <div class="place-slider-slide">
          <div class="dangerous-overlay"></div>
          <img src="${url}" alt="${place.name}" loading="lazy">
        </div>
      `).join('');
            const dots = photos.map((_, i) => `
        <button class="place-slider-dot${i === 0 ? ' active' : ''}" onclick="event.stopPropagation()"></button>
      `).join('');
            const badgeHtml = SafetyBadge_js_1.SafetyBadge.getHtml(place.safetyScore || 3.4, true);
            return `
        <div class="place-card dangerous-place-card" data-place-id="${place.id}" data-slider-id="danger_${place.id}">
          <div class="place-slider">
            <div class="warning-badge-icon">⚠️</div>
            <div class="place-slider-track">${slides}</div>
            <div class="place-slider-dots">${dots}</div>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="place-tag dangerous-tag">${place.tag || 'Опасная зона'}</span>
              ${badgeHtml}
            </div>
            <h4 class="dangerous-title">${place.name}</h4>
            <p>${(place.desc || '').substring(0, 75)}…</p>
          </div>
        </div>
      `;
        }).join('');
        // Attach click listeners
        filtered.forEach(place => {
            const card = container.querySelector(`[data-place-id="${place.id}"]`);
            if (card) {
                card.addEventListener('click', () => onPlaceClick(place.id));
            }
        });
    }
}
exports.DangerousPlacesSlider = DangerousPlacesSlider;
