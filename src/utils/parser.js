export default (data, url) => {
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(data, 'application/xhtml+xml');
  const error = parsedData.querySelector('parsererror');

  if (error) {
    /* eslint no-console: ["error", { allow: ["warn"] }] */
    console.warn('Something went wrong while parsing. Check output below:');
    console.warn(error);
    throw new Error('badRSS');
  }

  const feed = {
    feedTitle: parsedData.querySelector('title').textContent,
    description: parsedData.querySelector('description').textContent,
    link: url,
  };

  const items = parsedData.querySelectorAll('item');
  const posts = [...items].map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;

    return {
      feedTitle: feed.feedTitle,
      title,
      description,
      link,
    };
  });

  return { feed, posts };
};
