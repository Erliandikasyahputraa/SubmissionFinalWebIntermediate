import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStoriesListEmptyTemplate,
  generateStoriesListErrorTemplate,
  generateSaveReportButtonTemplate,
  generateRemoveReportButtonTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import Map from '../../utils/map';
import * as MyKisahAPI from '../../data/api';
import Database from '../../data/database';

export default class HomePage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="stories-list__map__container">
          <div id="map" class="stories-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">Daftar Cerita</h1>

        <div class="stories-list__container">
          <div id="stories-list"></div>
          <div id="stories-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.initialMap();
    this.#presenter = new HomePresenter({
      view: this,
      model: MyKisahAPI,
    });
    await this.#presenter.initialGalleryAndMap();
  }

  async populateStoriesList(message, stories) {
    if (stories.length <= 0) {
      this.populateStoriesListEmpty();
      return;
    }

    const html = await Promise.all(
      stories.map(async (story) => {
        if (story.lat && story.lon) {
          const coordinate = [story.lat, story.lon];
          this.#map.addMarker(coordinate, { alt: story.title }, { content: `<strong>${story.name}</strong><br>${story.description}` });
        } else {
          console.error('Data lokasi hilang untuk story:', story);
          const defaultCoordinate = [0, 0];
          this.#map.addMarker(defaultCoordinate, { alt: 'Tidak ada lokasi' }, { content: 'Tidak ada lokasi' });
        }

        const isSaved = await Database.getReportById(story.id);
        console.log(`Story ${story.id} isSaved: ${!!isSaved}`); // Debug log
        const saveButton = isSaved
          ? generateRemoveReportButtonTemplate()
          : generateSaveReportButtonTemplate();

        const storyHtml = generateStoryItemTemplate({
          ...story,
          userName: story.name,
          description: story.description,
          evidenceImages: [story.photoUrl],
          createdAt: story.createdAt,
          location: { lat: story.lat, lon: story.lon } || { lat: null, lon: null },
          isSaved: !!isSaved,
        });

        return storyHtml.replace(
          '<div id="save-actions-container"></div>',
          `<div id="save-actions-container">${saveButton}</div>`
        );
      })
    );

    document.getElementById('stories-list').innerHTML = `
      <div class="stories-list">${html.join('')}</div>
    `;

    this.addSaveButtonListeners(stories);
  }

  populateStoriesListEmpty() {
    document.getElementById('stories-list').innerHTML = generateStoriesListEmptyTemplate();
  }

  populateStoriesListError(message) {
    document.getElementById('stories-list').innerHTML = generateStoriesListErrorTemplate(message);
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 10,
      locate: true,
    });
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showLoading() {
    document.getElementById('stories-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    document.getElementById('stories-list-loading-container').innerHTML = '';
  }

  addSaveButtonListeners(stories) {
    stories.forEach((story) => {
      const storyElement = document.querySelector(`.story-item[data-reportid="${story.id}"]`);
      if (!storyElement) return;

      const saveButton = storyElement.querySelector('#report-detail-save');
      const removeButton = storyElement.querySelector('#report-detail-remove');

      if (saveButton) {
        saveButton.addEventListener('click', async () => {
          try {
            await Database.putReport({
              id: story.id,
              name: story.name,
              description: story.description,
              photoUrl: story.photoUrl,
              createdAt: story.createdAt,
              lat: story.lat,
              lon: story.lon,
            });
            storyElement.querySelector('#save-actions-container').innerHTML =
              generateRemoveReportButtonTemplate();
            this.addSaveButtonListeners(stories); // Reattach listeners
          } catch (error) {
            console.error('Error saving report:', error);
            alert('Gagal menyimpan laporan!');
          }
        });
      }

      if (removeButton) {
        removeButton.addEventListener('click', async () => {
          try {
            await Database.removeReport(story.id);
            storyElement.querySelector('#save-actions-container').innerHTML =
              generateRemoveReportButtonTemplate();
            this.addSaveButtonListeners(stories); // Reattach listeners
          } catch (error) {
            console.error('Error removing report:', error);
            alert('Gagal menghapus laporan!');
          }
        });
      }
    });
  }
}