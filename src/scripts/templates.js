import { showFormattedDate } from './utils';

export function generateLoaderTemplate() {
  return `
    <div class="loader"></div>
  `;
}

export function generateLoaderAbsoluteTemplate() {
  return `
    <div class="loader loader-absolute"></div>
  `;
}

export function generateMainNavigationListTemplate() {
  return `
    <li><a id="report-list-button" class="report-list-button" href="#/">Daftar Laporan</a></li>
    <li><a id="bookmark-button" class="bookmark-button" href="#/bookmark">Laporan Tersimpan</a></li>
  `;
}

export function generateUnauthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="login-button" href="#/login">Login</a></li>
    <li><a id="register-button" href="#/register">Register</a></li>
  `;
}

export function generateAuthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="new-story-button" class="btn new-story-button" href="#/new">Buat Cerita <i class="fas fa-plus"></i></a></li>
    <li><a id="logout-button" class="logout-button" href="#/logout"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
  `;
}

export function generateStoriesListEmptyTemplate() {
  return `
    <div id="stories-list-empty" class="stories-list__empty">
      <h2>Tidak ada cerita yang tersedia</h2>
      <p>Saat ini, tidak ada cerita yang dipublikasi.</p>
    </div>
  `;
}

export function generateReportsListEmptyTemplate() {
  return `
    <div id="reports-list-empty" class="reports-list__empty">
      <h2>Tidak ada laporan tersimpan</h2>
      <p>Saat ini, tidak ada laporan yang disimpan.</p>
    </div>
  `;
}

export function generateStoriesListErrorTemplate(message) {
  return `
    <div id="stories-list-error" class="stories-list__error">
      <h2>Terjadi kesalahan saat pengambilan data</h2>
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}

export function generateReportsListErrorTemplate(message) {
  return `
    <div id="reports-list-error" class="reports-list__error">
      <h2>Terjadi kesalahan saat pengambilan data</h2>
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}

export function generateStoryItemTemplate({
  id,
  description,
  evidenceImages,
  userName,
  createdAt,
  location,
  isSaved,
}) {
  const saveButton = isSaved
    ? generateRemoveReportButtonTemplate()
    : generateSaveReportButtonTemplate();

  return `
    <div tabindex="0" class="story-item" data-reportid="${id}">
      <img class="story-item__image" src="${evidenceImages[0]}" alt="Image Form ${userName}">
      <div class="story-item__body">
        <div class="story-item__main">
          <div class="story-item__more-info">
            <div class="story-item__createdat">
              <i class="fas fa-calendar-alt"></i> ${showFormattedDate(createdAt, 'id-ID')}
            </div>
            <div class="story-item__location">
              <i class="fas fa-map-marker-alt"></i> ${location && location.lat && location.lon ? `${location.lat}, ${location.lon}` : 'Lokasi tidak tersedia'}
            </div>
          </div>
        </div>
        <div id="story-description" class="story-item__description">
          ${description}
        </div>
        <div class="story-item__more-info">
          <div class="story-item__author">
            <i class="fas fa-user"></i> ${userName}
          </div>
        </div>
        <div id="save-actions-container">${saveButton}</div>
      </div>
    </div>
  `;
}

export function generateReportItemTemplate({
  id,
  description,
  photoUrl,
  createdAt,
  lat,
  lon,
  name,
}) {
  return `
    <div tabindex="0" class="bookmark-item" data-reportid="${id}">
      <img class="bookmark-item__image" src="${photoUrl}" alt="Image from ${name}">
      <div class="bookmark-item__body">
        <div class="bookmark-item__main">
          <div class="bookmark-item__more-info">
            <div class="bookmark-item__createdat">
              <i class="fas fa-calendar-alt"></i> ${showFormattedDate(createdAt, 'id-ID')}
            </div>
            <div class="bookmark-item__location">
              <i class="fas fa-map-marker-alt"></i> ${lat && lon ? `${lat}, ${lon}` : 'Lokasi tidak tersedia'}
            </div>
          </div>
        </div>
        <div id="report-description" class="bookmark-item__description">
          ${description}
        </div>
        <div class="bookmark-item__more-info">
          <div class="bookmark-item__author">
            <i class="fas fa-user"></i> ${name}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function generateSubscribeButtonTemplate() {
  return `
    <button id="subscribe-button" class="btn subscribe-button">
      Subscribe <i class="fas fa-bell"></i>
    </button>
  `;
}

export function generateUnsubscribeButtonTemplate() {
  return `
    <button id="unsubscribe-button" class="btn unsubscribe-button">
      Unsubscribe <i class="fas fa-bell-slash"></i>
    </button>
  `;
}

export function generateSaveReportButtonTemplate() {
  return `
    <button id="report-detail-save" class="btn btn-transparent" title="Simpan laporan">
      <i class="far fa-bookmark"></i> Simpan
    </button>
  `;
}

export function generateRemoveReportButtonTemplate() {
  return `
    <button id="report-detail-remove" class="btn btn-transparent" title="Hapus laporan">
      <i class="fas fa-bookmark"></i> Hapus
    </button>
  `;
}