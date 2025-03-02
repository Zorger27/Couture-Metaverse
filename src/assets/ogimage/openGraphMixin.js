export const openGraphMixin = {
  methods: {
    setPageTitle(mainTitle) {
      // Проверка, существует ли уже тег <title>
      let pageTitle = document.querySelector('title');

      if (pageTitle) {
        // Если тег <title> существует, обновить его содержимое
        pageTitle.innerText = mainTitle;
      } else {
        // Если тег <title> не существует, создать новый
        const newTitleTag = document.createElement('title');
        newTitleTag.innerText = mainTitle;
        document.head.appendChild(newTitleTag);
      }

      // Создание <link rel="canonical" href="https://couture-metaverse.vercel.app"/> - часто Google требует!

      // Проверка, существует ли уже тег <link rel="canonical">
      const canonicalUrl = 'https://couture-metaverse.vercel.app'; // Переменная для URL
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        // Если <link rel="canonical"> не существует, создать новый
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        canonicalLink.setAttribute('href', canonicalUrl);
        document.head.appendChild(canonicalLink);
      } else {
        // Если <link rel="canonical"> существует, обновить его href
        canonicalLink.setAttribute('href', canonicalUrl);
      }
    },

    setOpenGraphTags(metaDescription, title, description, imageUrl, url) {
      const metaTags = [
        { name: 'description', content: metaDescription },
        { property: 'og:title', content: title },
        { property: 'twitter:title', content: title },
        { property: 'og:description', content: description },
        { property: 'twitter:description', content: description },
        { property: 'og:image', content: imageUrl },
        { property: 'twitter:image', content: imageUrl },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'https://couture-metaverse.vercel.app' },
        { property: 'twitter:card', content: 'summary_large_image' }
      ];

      metaTags.forEach((metaTag) => {
        const meta = document.createElement('meta');
        if (metaTag.property) {
          meta.setAttribute('property', metaTag.property);
        } else if (metaTag.name) {
          meta.setAttribute('name', metaTag.name);
        }
        meta.setAttribute('content', metaTag.content);

        // Удалить существующие мета-теги с тем же property или name
        const existingMetaTags = document.querySelectorAll(
          `[property="${metaTag.property}"], [name="${metaTag.name}"]`
        );
        existingMetaTags.forEach((tag) => tag.remove());

        // Добавить новый мета-тег
        document.head.appendChild(meta);
      });
    },
  },
};
