import { isNotificationGranted, isCurrentPushSubscriptionAvailable } from '../../utils/notification-helper';

export default class NewPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showNewFormMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showNewFormMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async postNewStory({ description, photo, lat, lon }) {
    this.#view.showSubmitLoadingButton();
    try {
      const data = {
        description: description,
        photo: photo,
        lat: lat,
        lon: lon,
      };
      const response = await this.#model.storeNewStory(data);

      if (!response.ok) {
        console.error('postNewStory: response:', response);
        this.#view.storeFailed(response.message);
        return;
      }

      // Cek apakah notifikasi diizinkan dan langganan push TIDAK aktif
      const isNotificationAllowed = isNotificationGranted();
      const isSubscribed = await isCurrentPushSubscriptionAvailable();

      if (isNotificationAllowed && !isSubscribed && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            registration.active.postMessage({
              type: 'story_created',
              description: description,
            });
            console.log('Sent story_created message to service worker');
          } else {
            console.warn('Service worker not active');
            alert(`Story berhasil dibuat: ${description}`);
          }
        } catch (error) {
          console.error('Error sending message to service worker:', error);
          alert(`Story berhasil dibuat: ${description}`);
        }
      } else {
        // Fallback ke alert jika notifikasi tidak tersedia atau pengguna sudah berlangganan
        alert(`Story berhasil dibuat: ${description}`);
      }

      this.#view.storeSuccessfully(response.message, response.data);
    } catch (error) {
      console.error('postNewStory: error:', error);
      this.#view.storeFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}