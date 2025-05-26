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
    let uploadInProgress = false;

    // Handle form cancel
    document.querySelector('a[href="#/"]').addEventListener('click', (e) => {
      if (uploadInProgress) {
        e.preventDefault();
        if (confirm('Upload sedang berlangsung. Anda yakin ingin membatalkan?')) {
          uploadInProgress = false;
          location.hash = '/';
        }
      }
    });

    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (uploadInProgress) return;
      
      try {
        uploadInProgress = true;
        const data = this.#collectFormData();
        await this.#presenter.postNewStory(data);
      } finally {
        uploadInProgress = false;
      }
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        const fileSize = files[0].size;
        const MAX_FILE_SIZE = 1000000; // 1MB
        
        if (fileSize > MAX_FILE_SIZE) {
          alert('Ukuran file terlalu besar. Maksimal 1MB');
          event.target.value = ''; // Clear the input
          return;
        }
      }
      await this.#handleFileInput(files);
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
    // Wait for map container to be ready
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      throw new Error('Map container not found');
    }

    const lat = parseFloat(this.#form.elements.namedItem('lat').value);
    const lon = parseFloat(this.#form.elements.namedItem('lon').value);

    // Create map instance after container is confirmed to exist
    const map = new Map('#map', {
      center: [lat, lon],
      zoom: 13,
    });

    const customIcon = map.createIcon({
      iconUrl: '/marker-icon-2x.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const marker = map.addMarker([lat, lon], {
      draggable: true,
      icon: customIcon,
    });

    // Update coordinates when marker is moved
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
    const MAX_FILE_SIZE = 1000000; // 1MB
    
    try {
      this.showUploadLoading();
      
      // Compress image before adding to taken pictures
      const compressImage = async (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const maxWidth = 800;
              let width = img.width;
              let height = img.height;
              
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
              
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              
              canvas.toBlob((blob) => {
                resolve(blob);
              }, 'image/jpeg', 0.7);
            };
          };
          reader.onerror = reject;
        });
      };

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          alert(`File ${file.name} terlalu besar. Maksimal ukuran file adalah 1MB`);
          continue;
        }
        const compressedImage = await compressImage(file);
        await this.#addTakenPicture(compressedImage);
      }
    } catch (error) {
      console.error('Error handling files:', error);
      alert('Gagal memproses gambar');
    } finally {
      this.hideUploadLoading();
      await this.#populateTakenPictures();
    }
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

  showUploadLoading() {
    const loadingEl = document.createElement('div');
    loadingEl.id = 'upload-loading';
    loadingEl.innerHTML = '<div class="loader">Memproses gambar...</div>';
    document.querySelector('.new-form__documentations__container').appendChild(loadingEl);
  }

  hideUploadLoading() {
    const loadingEl = document.getElementById('upload-loading');
    if (loadingEl) loadingEl.remove();
  }
}
