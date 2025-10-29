export const SITE = {
  website: "https://lhasa.icu",
  author: "lhasa",
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
  
// 图片组件配置
  imageConfig: {
    // 图片资源配置
    imagesUrl: "https://cos.lhasa.icu/dist/images",
    exifUrl: "https://lhasa-1253887673.cos.ap-shanghai.myqcloud.com/dist/images",
    
    // 标签样式配置
    tags: {
      defaultStyle: "long" as "long" | "short" | false, // 默认标签样式：long长条形、short标签形、false不显示
    },
    
    // EXIF配置
    exif: {
      enabled: true,           // EXIF信息显示开关
      cache: {
        enabled: true,         // EXIF缓存开关
        expiryDays: 7,        // 缓存过期天数
      },
    },
    
    // 图片加载配置
    loading: {
      lazy: true,             // 懒加载开关
      quality: {
        enabled: true,        // 图片质量优化开关
        defaultSize: "1600-2400", // 默认LightGallery尺寸
      },
    },
    
    // LightGallery配置
    lightGallery: {
      enabled: true,          // LightGallery开关
      mousewheel: true,       // 鼠标滚轮支持
      download: true,        // 下载按钮
      selector: '.lightgallery-wrapper > a', // 选择器
      subHtmlSelectorRelative: true,
    },
  },
} as const;