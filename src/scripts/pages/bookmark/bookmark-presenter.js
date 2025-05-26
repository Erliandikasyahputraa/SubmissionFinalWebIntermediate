export default class BookmarkPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
    this.#init();
  }

  async #init() {
    this.#view.showReportsListLoading();
    try {
      const reports = await this.#model.getAllReports();
      this.#view.populateBookmarkedReports(null, reports);
    } catch (error) {
      console.error('Error fetching bookmarked reports:', error);
      this.#view.populateBookmarkedReportsError('Gagal memuat laporan tersimpan.');
    } finally {
      this.#view.hideReportsListLoading();
    }
  }
}