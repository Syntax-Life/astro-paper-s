export const SITE = {
  website: "https://lhasa.icu", // replace this with your deployed domain, e.g. https://ziteh.github.io/
  author: "lhasa", // 君の名は ~
  profile: "https://github.com/achuanya",
  desc: "骑过湖边的小径，走过文字里的角落，偶尔停下，看见风，也看见自己",
  title: "游钓四方",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 10,
  postPerPage: 10,
  postPerArchive: 10,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  genDescriptionMaxLines: 30, // Max number of lines to process
  genDescriptionCount: 200, // If 'more' tag is not found, use this count of characters
  showArchives: true,
  showBackButton: false, // show back button in post detail
  showPageDesc: false, // show page description in post detail
  editPost: {
    enabled: false,
    text: "Suggest Changes",
    url: "https://github.com/satnaing/astro-paper/tree/main/",
  },
  dynamicOgImage: false,
  lang: "zh-CN", // html lang code. Set this empty and default will be "en"
  langOg: "zh_CN", // Open Graph locale tag, format 'language_TERRITORY' https://ogp.me/#optional
  timezone: "Asia/Taipei", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
  wontonCommentUrl: "", // Wonton comment server URL, set to empty string to disable comment
  
  // Display control options for article cards
  displayOptions: {
    showSubtitle: false, // Show subtitle in article cards
    showDescription: false, // Show description in article cards  
    showTags: true, // Show tags in article cards
    showHeaderSocialLinks: false, // Show social links in header/main content area
    showFooterSocialLinks: true, // Show social links in footer
    showDate: false, // Show date in article pages
  },
  
  // LightGallery
  lightGallery: {
    enabled: true,
  },
} as const;

// 图片相关配置
export const IMAGES = "https://cos.lhasa.icu/dist/images";
export const EXIF = "https://lhasa-1253887673.cos.ap-shanghai.myqcloud.com/dist/images";
