const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const SitemapPlugin = require('sitemap-webpack-plugin').default

module.exports = {
  pages: undefined, // Полностью отключаем встроенный механизм страниц
    pwa: {
    manifestPath: "https://couture-metaverse.vercel.app/assets/favicon/manifest.webmanifest",
    iconPaths: {
      favicon32: null,
      favicon16: null,
      appleTouchIcon: null,
      maskIcon: null,
      msTileImage: null
    }
  },
    configureWebpack: {
    plugins: [
      new CopyWebpackPlugin({ //СУПЕР-ВАЖНАЯ штука для ссылок на файлы (pdf или картинки), расположенные на самом сервере!!!
        patterns: [
          {
            from: "src/assets",
            to: "assets"
          },
          {
            from: "src/assets/analytics/robots.txt",
            to: "",
            toType: "dir",
            force: true
          }
        ]
      }),
      new HtmlWebpackTagsPlugin({
        scripts: [
          'https://www.googletagmanager.com/gtag/js?id=G-R9BM79JPHS',
          '/assets/analytics/ganal.js',
        ],
        append: true,
        publicPath: false,
        useHash: false,
        metas: [
          {attributes: {name: 'google-site-verification', content: 'Gq9vrXtN91P1JteGFo-xrlLKT0PR8u-4P4xs21oUr8Y'}},
          {attributes: {name: 'description', content: 'Couture Metaverse 3D'}},
          {attributes: {property: 'og:title', content: 'Couture Metaverse 3D'}},
          {attributes: {property: 'twitter:title', content: 'Couture Metaverse 3D'}},
          {attributes: {property: 'og:description', content: 'A unique platform for creating and customizing 3D models!'}},
          {attributes: {property: 'twitter:description', content: 'Couture Metaverse 3D'}},
          {attributes: {property: 'og:image', content: 'https://couture-metaverse.vercel.app/assets/ogimage/bmp/image_all.jpg'}},
          {attributes: {property: 'twitter:image', content: 'https://couture-metaverse.vercel.app/assets/ogimage/bmp/image_all.jpg'}},
          {attributes: {property: 'og:url', content: 'https://couture-metaverse.vercel.app'}},
          {attributes: {property: 'og:type', content: 'website'}},
          {attributes: {property: 'og:site_name', content: 'https://couture-metaverse.vercel.app'}},
          {attributes: {property: 'twitter:card', content: 'summary_large_image'}}
        ]
      }),
      new FaviconsWebpackPlugin({
        logo: './src/assets/img/favbig.png',
        mode: 'webapp',
        devMode: 'webapp',
        outputPath: 'assets/favicon/', // Куда будут на сервере скидываться созданные favicon-ки
        prefix: 'assets/favicon/', // Этот префикс для файла index.html, чтобы правильно прописать пути иконок с сервера!
        manifest: './src/assets/manifest/manifest.webmanifest',
        favicons: {
          appName: 'Couture Metaverse 3D',
          appDescription: 'Couture Metaverse 3D',
          developerName: 'Zorger',
          developerURL: null
        }
      }),
      new SitemapPlugin({
        base: 'https://couture-metaverse.vercel.app', // Базовый URL моего сайта
        paths: [
          { path: '/', priority: 1, changefreq: 'always' },
          { path: '/project2', priority: 1, changefreq: 'always' },
          { path: '/project3', priority: 1, changefreq: 'always' },
          { path: '/about', priority: 1, changefreq: 'always' },
        ],
        options: {
          skipgzip: true
        },
      }),
    ]
  }
};