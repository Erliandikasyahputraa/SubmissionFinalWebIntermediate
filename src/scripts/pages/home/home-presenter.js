import Database from '../../data/database';

export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async initialGalleryAndMap() {
    this.#view.showLoading();
    try {
      const response = await this.#model.getAllStories();

      if (!response.ok) {
        console.error('initialGalleryAndMap: response:', response);
        this.#view.populateStoriesListError(response.message);
        return;
      }

      // Cek status simpan untuk setiap story
      const storiesWithSaveStatus = await Promise.all(
        response.listStory.map(async (story) => {
          const isSaved = await Database.getReportById(story.id);
          return { ...story, isSaved: !!isSaved };
        })
      );

      this.#view.populateStoriesList(response.message, storiesWithSaveStatus);
    } catch (error) {
      console.error('initialGalleryAndMap: error:', error);
      this.#view.populateStoriesListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}