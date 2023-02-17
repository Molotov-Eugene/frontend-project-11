import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';
import resources from './locales/index.js';
import render from './view/watchers.js';
import localeRender from './view/locale-render.js';
import updatePosts from './utils/update-posts.js';
import isValidUrl from './utils/isValidUrl.js';
import parse from './utils/parser.js';
import utils from './utils.js';

const app = () => {
  const defaultLanguage = document.documentElement.lang;

  const state = {
    lng: defaultLanguage,
    formState: {
      error: '',
      status: '',
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

  // form handler

  const { proxy } = utils;
  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    watchedState.formState.status = 'sending';

    const formData = new FormData(elements.form);
    const url = formData.get(elements.input.name).trim();
    const addedUrls = watchedState.feeds.map((feed) => feed.link);

    isValidUrl(url, addedUrls).then(() => {
      axios({ url: proxy(url) }).then((response) => {
        watchedState.formState.error = '';
        const data = parse(response.data.contents, url);
        const { feed, posts } = data;
        const postsWithID = posts.map((x) => ({ ...x, id: uniqueId() }));
        watchedState.feeds.unshift(feed);
        watchedState.posts.unshift(...postsWithID);
        watchedState.formState.status = 'recieved';
      }).catch((e) => {
        const errorMessage = i18n.t(e.message) !== '' ? i18n.t(e.message) : i18n.t('errors.network');
        watchedState.formState.error = errorMessage;
        watchedState.formState.status = 'error';
      });
    }).catch((e) => {
      const errorMessage = i18n.t(e.message) !== '' ? i18n.t(e.message) : i18n.t('errors.network');
      watchedState.formState.status = 'error';
      watchedState.formState.error = errorMessage;
    });
  });

  // modal handler

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
