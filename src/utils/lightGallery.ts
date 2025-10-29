/**
 * LightGallery 初始化工具
 * 处理图片灯箱功能的初始化和管理
 */

import { SITE } from "@/config";

declare global {
  interface Window {
    lightGallery: any;
  }
  
  interface HTMLElement {
    lightGalleryInstance?: any;
  }
}

/**
 * 初始化 LightGallery
 * 在页面加载时初始化图片灯箱功能
 */
export function initLightGallery(): void {
  // 检查LightGallery功能是否启用
  if (!SITE.imageConfig.lightGallery.enabled) {
    return;
  }
  
  const galleryContainer = document.body;
  
  // 销毁已存在的实例，避免重复初始化
  if (galleryContainer.lightGalleryInstance) {
    galleryContainer.lightGalleryInstance.destroy();
  }
  
  // 初始化LightGallery
  galleryContainer.lightGalleryInstance = window.lightGallery(galleryContainer, {
    selector: SITE.imageConfig.lightGallery.selector,
    subHtmlSelectorRelative: SITE.imageConfig.lightGallery.subHtmlSelectorRelative,
    mousewheel: SITE.imageConfig.lightGallery.mousewheel,
    download: SITE.imageConfig.lightGallery.download,
    mode: 'lg-zoom-in-out', // 使用自定义的 zoom-in-out 过渡动画
  });
}

/**
 * 设置 LightGallery 事件监听器
 * 监听页面加载和 Astro 路由切换事件
 */
export function setupLightGalleryListeners(): void {
  // 检查LightGallery功能是否启用
  if (!SITE.imageConfig.lightGallery.enabled) {
    return;
  }
  
  // 监听页面加载和Astro路由切换事件
  document.addEventListener('DOMContentLoaded', initLightGallery);
  document.addEventListener('astro:page-load', initLightGallery);
}

// 自动设置事件监听器
if (typeof document !== 'undefined') {
  setupLightGalleryListeners();
}