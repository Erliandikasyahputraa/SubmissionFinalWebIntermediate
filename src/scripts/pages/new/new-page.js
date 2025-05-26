import NewPresenter from './new-presenter';
import { convertBase64ToBlob } from '../../utils';
import * as MyKisahAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import Camera from '../../utils/camera';
import Map from '../../utils/map';

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #takenDocumentations = [];

  async render() {
    return `
      <section>
        <div class="new-story__header">
          <div class="container">
            <h1 class="new-story__header__title">Publikasi Cerita Anda!</h1>
            <p class="new-story__header__description">
              Silakan lengkapi formulir di bawah untuk membuat cerita baru.<br>
            </p>
          </div>
        </div>
      </section>
  
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Apa yang anda fikirkan? <span style="color: red">*</span></label>  
              <div class="new-form__description__container">
               <textarea
  id="description-input"
  name="description"
  placeholder="TULIS KISAHMU DISINI!! 
Waktu? Tempat? Momen? CERITAKAN SEMUA! 
Buat kisahmu MELEDAK dengan detail yang BRUTAL!"
></textarea>
              </div>
            </div>
            <div class="form-control">
              <label for="documentations-input" class="new-form__documentations__title">Foto <span style="color: red">*</span></label>

              <div class="new-form__documentations__container">
                <div class="new-form__documentations__buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">
                    Ambil Gambar
                  </button>
                  <input
                    id="documentations-input"
                    name="documentations"
                    type="file"
                    accept="image/*"
                    multiple
                    hidden="hidden"
                    aria-multiline="true"
                    aria-describedby="documentations-more-info"
                  >
                   <button id="open-documentations-camera-button" class="btn" type="button">
                    Buka Kamera
                   </button>
                </div>
                <div id="camera-container" class="new-form__camera__container">
                  <video id="camera-video" class="new-form__camera__video">
                    Video stream not available.
                  </video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
  
                  <div class="new-form__camera__tools">
                    <select id="camera-select"></select>
                    <div class="new-form__camera__tools_buttons">
                      <button id="camera-take-button" class="btn" type="button">
                      Ambil Gambar
                      </button>
                    </div>
                  </div>
                </div>
                <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
              </div>
            </div>
            <div class="form-control">
              <div class="new-form__location__title">Lokasi</div>
  
              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng">
                  <input type="text" name="lat" value="-6.175389">
                  <input type="text" name="lon" value="106.827139">
                </div>
              </div>
            </div>
            <div class="form-buttons">
               <span id="submit-button-container">
                <button class="btn" type="submit">Posting</button>
              </span>
              <a class="btn" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#takenDocumentations = [];
    
    this.#setupForm(); // Initialize form elements
    
    this.#presenter = new NewPresenter({
      view: this,
      model: MyKisahAPI,
    });
  
    await this.#presenter.showNewFormMap(); // Render map after form setup
  }  

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = this.#collectFormData();
      await this.#presenter.postNewStory(data);
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      await this.#handleFileInput(event.target.files);
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations-input').click();
    });

    const cameraContainer = document.getElementById('camera-container');
    document
      .getElementById('open-documentations-camera-button')
      .addEventListener('click', async (event) => {
        this.#toggleCamera(event, cameraContainer);
      });
  }

  async initialMap() {
    const lat = parseFloat(this.#form.elements.namedItem('lat').value);
    const lon = parseFloat(this.#form.elements.namedItem('lon').value);
  
    // Membuat peta dan mengatur titik awal
    const map = L.map('map').setView([lat, lon], 13);
  
    // Menambahkan tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
  
    // Membuat ikon kustom dari file gambar lokal
    const customIcon = L.icon({
      iconUrl: '/marker-icon-2x.png', // Path relatif ke folder public
      iconSize: [32, 32], // Ukuran ikon
      iconAnchor: [16, 32], // Titik jangkar ikon (di mana posisi marker akan berada)
      popupAnchor: [0, -32], // Posisi popup relatif terhadap ikon
    });
  
    // Menambahkan marker dengan ikon kustom yang dapat digerakkan
    const marker = L.marker([lat, lon], {
      draggable: true,
      icon: customIcon, // Menggunakan ikon kustom
    }).addTo(map);
  
    // Memperbarui input lat dan lon saat marker dipindah
    marker.on('move', (event) => {
      const latLng = event.target.getLatLng();
      this.#form.elements.namedItem('lat').value = latLng.lat;
      this.#form.elements.namedItem('lon').value = latLng.lng;
    });
  }  

  #setupCamera() {
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });
    }

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const image = await this.#camera.takePicture();
      await this.#addTakenPicture(image);
      await this.#populateTakenPictures();
    });
  }

  #toggleCamera(event, cameraContainer) {
    cameraContainer.classList.toggle('open');
    this.#isCameraOpen = cameraContainer.classList.contains('open');

    if (this.#isCameraOpen) {
      event.currentTarget.textContent = 'Tutup Kamera';
      this.#setupCamera();
      this.#camera.launch();
      return;
    }

    event.currentTarget.textContent = 'Buka Kamera';
    this.#camera.stop();
  }

  #collectFormData() {
    return {
        description: this.#form.elements.namedItem('description').value,
        photo: this.#takenDocumentations.map((picture) => picture.blob),
        lat: parseFloat(this.#form.elements.namedItem('lat').value),  // pastikan jadi float
        lon: parseFloat(this.#form.elements.namedItem('lon').value), // pastikan jadi float
    };
}

  async #handleFileInput(files) {
    const insertingPicturesPromises = Object.values(files).map(async (file) => {
      return await this.#addTakenPicture(file);
    });
    await Promise.all(insertingPicturesPromises);
    await this.#populateTakenPictures();
  }

  async #addTakenPicture(image) {
    let blob = image instanceof String ? await convertBase64ToBlob(image, 'image/png') : image;

    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob,
    };

    this.#takenDocumentations = [...this.#takenDocumentations, newDocumentation];
  }

  async #populateTakenPictures() {
    const html = this.#takenDocumentations.reduce((accumulator, picture, currentIndex) => {
      const imageUrl = URL.createObjectURL(picture.blob);
      return accumulator.concat(`
        <li class="new-form__documentations__outputs-item">
          <button type="button" data-deletepictureid="${picture.id}" class="new-form__documentations__outputs-item__delete-btn">
            <img src="${imageUrl}" alt="Dokumentasi ke-${currentIndex + 1}">
          </button>
        </li>
      `);
    }, '');
    document.getElementById('documentations-taken-list').innerHTML = html;

    document.querySelectorAll('button[data-deletepictureid]').forEach((button) =>
      button.addEventListener('click', (event) => {
        const pictureId = event.currentTarget.dataset.deletepictureid;
        if (this.#removePicture(pictureId)) {
          this.#populateTakenPictures();
        }
      })
    );
  }

  #removePicture(id) {
    const selectedPicture = this.#takenDocumentations.find((picture) => picture.id == id);
    if (!selectedPicture) return null;

    this.#takenDocumentations = this.#takenDocumentations.filter((picture) => picture.id != selectedPicture.id);
    return selectedPicture;
  }

  storeSuccessfully(message) {
    console.log(message);
    this.clearForm();
    location.hash = '/';
  }

  storeFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Buat Cerita
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Buat Cerita</button>
    `;
  }
}
