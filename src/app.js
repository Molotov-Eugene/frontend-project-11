import onChange from 'on-change';
import i18next from 'i18next';
import resources from './locales/index.js';
import render from './view/watchers.js';
import localeRender from './view/locale-render.js';
import updatePosts from './utils/update-posts.js';
import isValidUrl from './utils/isValidUrl.js';
import getData from './utils/getData.js';

const app = () => {
  const defaultLanguage = document.documentElement.lang;

  const state = {
    lng: defaultLanguage,
    formState: {
      error: '',
      formState: '',
    },
    feeds: [],
    posts: [],
    UIstate: {
      activePost: null,
    },
  };

  const i18nConfig = {
    lng: defaultLanguage,
    debug: false,
    resources,
  };

  const i18n = i18next.createInstance();
  i18n.init(i18nConfig);

  const elements = {
    body: document.querySelector('body'),
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    button: document.querySelector('[aria-label="add"]'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    locale: {
      button: document.querySelector('[aria-label="add"]'),
      placeholder: document.querySelector('label[for="url-input"]'),
      tip: document.querySelector('.text-white-50'),
      header: document.querySelector('h1'),
      subHeader: document.querySelector('.lead'),
    },
    modal: {
      container: document.querySelector('.modal'),
      title: document.querySelector('.modal-title'),
      description: document.querySelector('.modal-body'),
      readButton: document.querySelector('.full-article'),
      closeButtons: document.querySelectorAll('[data-bs-dismiss="modal"]'),
    },
  };

  const watchedState = onChange(state, (path, value) => {
    render(path, value, elements, i18n);
  });

  // form handle

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    watchedState.formState.formState = 'sending';

    const formData = new FormData(elements.form);
    const url = formData.get(elements.input.name).trim();
    const addedUrls = watchedState.feeds.map((feed) => feed.link);

    const errorHandle = (e) => {
      watchedState.formState.error = e.message;
      watchedState.formState.formState = 'error';
    };

    Promise.all([isValidUrl(url, addedUrls), getData(url)])
      .then((values) => {
        const [, data] = values;
        watchedState.feeds.unshift(data.feed);
        watchedState.posts.unshift(...data.postsWithID);
        watchedState.formState.error = '';
        watchedState.formState.formState = 'recieved';
      }).catch(errorHandle);
  });

  // modal handle

  elements.posts.addEventListener('click', (event) => {
    if (event.target.dataset.bsToggle === 'modal') {
      const { id } = event.target.dataset;
      const activePost = watchedState.posts.find((p) => p.id === id);
      watchedState.UIstate.activePost = activePost;
      activePost.isReaded = true;
    }
  });

  elements.modal.closeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      watchedState.UIstate.activePost = null;
    });
  });

  localeRender(elements.locale, i18n);
  updatePosts(watchedState);
};

export default app;
