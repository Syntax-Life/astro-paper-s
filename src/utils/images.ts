/**
 * EXIF 数据处理工具
 * 处理图片 EXIF 信息的显示、缓存和预加载
 */

import { SITE } from "@/config";

// EXIF数据接口定义
export interface ExifData {
  [key: string]: {
    val: string;
  };
}

// 处理后的EXIF数据接口
export interface ProcessedExifData {
  settings?: string;
}

/**
 * 解析EXIF数据为可读格式
 */
export function parseExifData(data: ExifData): ProcessedExifData {
  const result: ProcessedExifData = {};
  const settings = [];

  // 安全解析浮点数（支持分数格式）
  function safeParseFloat(value: string | undefined): number | null {
    if (typeof value !== 'string') return null;
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 2) {
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          return num / den;
        }
      }
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  // 光圈
  if (data.FNumber?.val) {
    const aperture = safeParseFloat(data.FNumber.val);
    if (aperture !== null) {
      settings.push(`光圈 F/${aperture.toFixed(1)}`);
    }
  }
  
  // 快门速度
  if (data.ExposureTime?.val) {
    const exposure = safeParseFloat(data.ExposureTime.val);
    if (exposure !== null) {
      if (exposure >= 1) {
        settings.push(`快门 ${exposure.toFixed(1)}s`);
      } else {
        settings.push(`快门 1/${Math.round(1/exposure)}s`);
      }
    }
  }
  
  // ISO
  if (data.ISOSpeedRatings?.val) {
    settings.push(`感光度 ISO${data.ISOSpeedRatings.val}`);
  }

  // 焦距
  if (data.FocalLength?.val) {
    const focal = safeParseFloat(data.FocalLength.val);
    if (focal !== null) {
      settings.push(`焦距 ${focal.toFixed(1)}mm`);
    }
  }

  // 色彩空间
  if (data.ColorSpace?.val) {
    settings.push(`色彩 ${data.ColorSpace.val}`);
  }

  // 白平衡
  if (data.WhiteBalance?.val) {
    const wb = data.WhiteBalance.val === "0" ? "自动白平衡" : "手动白平衡";
    settings.push(wb);
  }

  // 拍摄时间
  if (data.DateTimeOriginal?.val) {
    const dateStr = data.DateTimeOriginal.val;
    const date = dateStr.split(' ')[0].replace(/:/g, '-');
    settings.push(`拍摄 ${date}`);
  }

  // 设备型号
  if (data.Software?.val) {
    let deviceName = data.Software.val;
    // 特殊处理Samsung型号
    const s23UltraModels = ["S9180ZCU6DYDA", "S9180ZCS6DYF1"];
    if (s23UltraModels.includes(deviceName) || deviceName.startsWith("S9180")) {
      deviceName = "Samsung Galaxy S23 Ultra";
    }
    settings.push(`设备 ${deviceName}`);
  } else {
    // 如果找不到设备型号，默认为 Xiaomi 15
    settings.push("设备 Xiaomi 15");
  }

  // 只有当设置项足够多时才返回
  if (settings.length >= 6) {
    result.settings = settings.join(' · ');
  }

  return result;
}

/**
 * 格式化EXIF数据显示
 */
export function formatExifDisplay(exifData: ProcessedExifData): string {
  return exifData.settings || 'EXIF data unavailable';
}

/**
 * 生成模拟EXIF数据（当真实数据不可用时）
 */
export function generateMockExifData(imageSrc: string): string {
  // 获取文章发布日期
  const getPublishDate = (): string => {
    const pubDateElement = document.getElementById('pub-datetime');
    const dateTime = pubDateElement?.getAttribute('datetime');
    
    if (dateTime) return dateTime.split('T')[0];
    
    const dateText = pubDateElement?.textContent?.trim();
    if (dateText) {
      const date = new Date(dateText);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  };

  // 简单哈希函数，用于生成一致的随机参数
  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const hash = simpleHash(imageSrc);
  
  // 预定义的参数数组
  const params = {
    apertures: ['1.4', '1.7', '2.0', '2.8', '4.0', '5.6'],
    shutterSpeeds: ['1/60', '1/125', '1/250', '1/500', '1/715', '1/1000'],
    isoValues: ['100', '200', '400', '800', '1600'],
    focalLengths: ['24', '35', '50', '85', '135'],
    devices: ['Samsung Galaxy S23 Ultra', 'Xiaomi 15']
  };

  // 基于哈希值选择参数
  const aperture = params.apertures[hash % params.apertures.length];
  const shutterSpeed = params.shutterSpeeds[(hash >> 3) % params.shutterSpeeds.length];
  const iso = params.isoValues[(hash >> 6) % params.isoValues.length];
  const focalLength = params.focalLengths[(hash >> 9) % params.focalLengths.length];
  const device = params.devices[(hash >> 12) % params.devices.length];
  const publishDate = getPublishDate();

  return `光圈 F/${aperture} · 快门 ${shutterSpeed}s · 感光度 ISO${iso} · 焦距 ${focalLength}mm · 色彩 sRGB · 自动白平衡 · 拍摄 ${publishDate} · 设备 ${device}`;
}

/**
 * 持久化EXIF缓存管理器
 */
export class PersistentExifCache {
  private memoryCache = new Map<string, string>();
  private readonly STORAGE_KEY = 'exif-cache';
  private readonly CACHE_VERSION = '1.0';
  private readonly DEFAULT_EXPIRY_DAYS = SITE.imageConfig.exif.cache.expiryDays; // 从配置获取缓存有效期

  constructor() {
    this.loadFromStorage();
  }

  // 从localStorage加载缓存
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);
      if (data.version !== this.CACHE_VERSION) {
        // 版本不匹配时清空缓存
        localStorage.removeItem(this.STORAGE_KEY);
        return;
      }

      const now = Date.now();
      // 只加载未过期的缓存项
      Object.entries(data.cache || {}).forEach(([key, item]: [string, any]) => {
        if (item.expiry > now) {
          this.memoryCache.set(key, item.data);
        }
      });

      console.log(`从本地存储加载了 ${this.memoryCache.size} 个EXIF缓存项`);
    } catch (error) {
      console.log('加载EXIF缓存失败:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // 保存缓存到localStorage
  private saveToStorage() {
    try {
      const now = Date.now();
      const expiryTime = now + (this.DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      
      const cacheData: { [key: string]: { data: string; expiry: number } } = {};
      this.memoryCache.forEach((value, key) => {
        cacheData[key] = {
          data: value,
          expiry: expiryTime
        };
      });

      const storageData = {
        version: this.CACHE_VERSION,
        cache: cacheData,
        lastUpdated: now
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.log('保存EXIF缓存失败:', error);
    }
  }

  // 获取缓存数据
  get(key: string): string | undefined {
    return this.memoryCache.get(key);
  }

  // 设置缓存数据
  set(key: string, value: string) {
    this.memoryCache.set(key, value);
    // 异步保存，避免阻塞主线程
    setTimeout(() => this.saveToStorage(), 0);
  }

  // 检查缓存是否存在
  has(key: string): boolean {
    return this.memoryCache.has(key);
  }

  // 获取缓存大小
  get size(): number {
    return this.memoryCache.size;
  }

  // 清空所有缓存
  clear() {
    this.memoryCache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // 清理过期缓存
  cleanup() {
    this.loadFromStorage(); // 重新加载会自动过滤过期项
    this.saveToStorage();
  }
}

// 创建全局缓存实例
export const exifCache = new PersistentExifCache();

/**
 * 加载EXIF数据（支持缓存）
 */
export const loadExifData = async (exifUrl: string, imageSrc: string): Promise<string> => {
  const cacheKey = exifUrl || imageSrc;
  
  // 检查缓存是否启用
  if (!SITE.imageConfig.exif.cache.enabled) {
    // 缓存未启用，直接从服务器获取
    try {
      const response = await fetch(exifUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const processed = parseExifData(data);
      return formatExifDisplay(processed);
    } catch (error) {
      console.log('EXIF 加载失败，使用模拟数据:', error);
      return generateMockExifData(imageSrc);
    }
  }
  
  // 检查缓存
  if (exifCache.has(cacheKey)) {
    return exifCache.get(cacheKey)!;
  }

  try {
    // 从服务器获取EXIF数据
    const response = await fetch(exifUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const processed = parseExifData(data);
    const result = formatExifDisplay(processed);
    
    // 缓存结果
    exifCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.log('EXIF 加载失败，使用模拟数据:', error);
    // 生成并缓存模拟数据
    const mockData = generateMockExifData(imageSrc);
    exifCache.set(cacheKey, mockData);
    return mockData;
  }
};

/**
 * 从图片源加载EXIF数据
 */
export const loadExifFromSrc = async (imageSrc: string): Promise<string> => {
  return loadExifData(imageSrc, imageSrc);
};

/**
 * 检测是否为小屏幕设备
 */
export function isSmallScreen(): boolean {
  return window.innerWidth <= 768;
}

/**
 * 初始化EXIF提示框功能
 */
export function initExifTooltips() {
  // 检查EXIF功能是否启用
  if (!SITE.imageConfig.exif.enabled) {
    return;
  }
  
  const images = document.querySelectorAll('.img-main[data-show-exif="true"]');
  const isSmall = isSmallScreen();
  
  images.forEach((img) => {
    const exifUrl = img.getAttribute('data-exif-url');
    const tooltip = img.closest('.lightbox')?.querySelector('[data-exif-tooltip]') as HTMLElement;
    
    if (!tooltip) return;

    // 状态管理变量
    let isTooltipVisible = false;
    let isHovering = false;
    let isLoading = false;
    let exifDataCache: string | null = null;
    let hasShownOnce = false; // 小屏幕设备标记
    let hasAutoShown = false; // PC端自动显示标记
    let hideTimeout: NodeJS.Timeout | null = null;
    let showTimeout: NodeJS.Timeout | null = null;
    let autoHideTimeout: NodeJS.Timeout | null = null; // PC端自动隐藏

    // 清理所有定时器
    const clearTimeouts = () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
      }
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout);
        autoHideTimeout = null;
      }
    };

    // 显示提示框
    const showTooltip = async (isAutoShow = false) => {
      clearTimeouts();
      
      if (isTooltipVisible) return;

      // 加载EXIF数据
      if (!exifDataCache && !isLoading) {
        isLoading = true;
        const imageSrc = (img as HTMLImageElement).src;
        
        try {
          exifDataCache = exifUrl 
            ? await loadExifData(exifUrl, imageSrc)
            : await loadExifFromSrc(imageSrc);
        } catch (error) {
          console.log('EXIF 加载失败:', error);
          exifDataCache = generateMockExifData(imageSrc);
        }
        
        isLoading = false;
        
        // 更新提示框内容
        const content = tooltip.querySelector('.exif-content');
        if (content) {
          content.innerHTML = `<span class="exif-text">${exifDataCache}</span>`;
        }
      }
      
      // 显示提示框
      tooltip.classList.add('show');
      isTooltipVisible = true;
      hasShownOnce = true;
      
      // PC端自动显示时，3秒后自动隐藏
      if (isAutoShow && !isSmall) {
        autoHideTimeout = setTimeout(() => {
          if (!isHovering) {
            tooltip.classList.remove('show');
            isTooltipVisible = false;
          }
        }, 3000);
      }
    };

    // 隐藏提示框
    const hideTooltip = () => {
      // 小屏幕设备显示过后不再隐藏
      if (isSmall && hasShownOnce) {
        return;
      }
      
      clearTimeouts();
      hideTimeout = setTimeout(() => {
        tooltip.classList.remove('show');
        isTooltipVisible = false;
      }, 50);
    };

    if (isSmall) {
      // 小屏幕设备：使用Intersection Observer检测图片显示
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasShownOnce) {
            // 图片50%可见时自动显示EXIF
            showTooltip();
          }
        });
      }, {
        threshold: 0.5,
        rootMargin: '0px'
      });

      observer.observe(img);

      // 小屏幕设备：点击图片直接触发 LightGallery，不影响 EXIF 显示
      const imgWrapper = img.closest('.lightbox');
      const lightGalleryLink = imgWrapper?.querySelector('.lightgallery-link') as HTMLElement;
      
      if (lightGalleryLink) {
        img.addEventListener('click', () => {
          // 直接触发 LightGallery，不处理 EXIF
          lightGalleryLink.click();
        });
      }
    } else {
      // PC端：自动显示EXIF
      const autoShowObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasAutoShown) {
            // 图片50%可见时自动显示EXIF 3秒
            hasAutoShown = true;
            showTooltip(true);
          }
        });
      }, {
        threshold: 0.5,
        rootMargin: '0px'
      });

      autoShowObserver.observe(img);
      
      // PC端鼠标悬停逻辑
      const imgWrapper = img.closest('.lightbox');
      const hoverArea = imgWrapper || img.parentElement;
      
      const handleMouseEnter = () => {
        isHovering = true;
        clearTimeouts();
        
        showTimeout = setTimeout(() => {
          if (isHovering) showTooltip();
        }, 100);
      };

      const handleMouseLeave = (e: Event) => {
        isHovering = false;
        clearTimeouts();
        
        const mouseEvent = e as MouseEvent;
        const relatedTarget = mouseEvent.relatedTarget as Element;
        
        // 检查鼠标是否移动到相关元素
        if (relatedTarget && (
          tooltip.contains(relatedTarget) || 
          relatedTarget === tooltip ||
          (hoverArea && hoverArea.contains(relatedTarget))
        )) {
          isHovering = true;
          return;
        }
        
        hideTooltip();
      };

      // 绑定鼠标事件
      img.addEventListener('mouseenter', handleMouseEnter);
      img.addEventListener('mouseleave', handleMouseLeave);
      
      if (imgWrapper && imgWrapper !== img.parentElement) {
        imgWrapper.addEventListener('mouseenter', handleMouseEnter);
        imgWrapper.addEventListener('mouseleave', handleMouseLeave);
      }
      
      // 提示框鼠标事件
      tooltip.addEventListener('mouseenter', () => {
        isHovering = true;
        clearTimeouts();
      });
      
      tooltip.addEventListener('mouseleave', (e: Event) => {
        isHovering = false;
        const mouseEvent = e as MouseEvent;
        const relatedTarget = mouseEvent.relatedTarget as Element;
        
        if (relatedTarget && (
          img.contains(relatedTarget) || 
          relatedTarget === img ||
          (imgWrapper && imgWrapper.contains(relatedTarget))
        )) {
          isHovering = true;
          return;
        }
        
        hideTooltip();
      });
    }
  });
}

/**
 * EXIF预加载管理器
 */
export class ExifPreloader {
  private loadingQueue: Array<{ img: HTMLImageElement; exifUrl: string | null }> = [];
  private isProcessing = false;
  private processedImages = new Set<string>(); // 已处理图片记录
  private readonly BATCH_SIZE = 3; // 批处理大小
  private readonly DELAY_BETWEEN_BATCHES = 500; // 批次间延迟

  // 添加图片到预加载队列
  addToQueue(img: HTMLImageElement, exifUrl: string | null) {
    const imageSrc = img.src;
    const cacheKey = exifUrl || imageSrc;
    
    // 跳过已缓存的图片
    if (exifCache.has(cacheKey)) {
      return;
    }

    // 跳过已在队列中的图片
    if (this.processedImages.has(imageSrc)) {
      return;
    }

    // 添加到队列
    this.processedImages.add(imageSrc);
    this.loadingQueue.push({ img, exifUrl });
  }

  // 开始预加载处理
  async startPreloading() {
    if (this.isProcessing || this.loadingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`开始预加载 ${this.loadingQueue.length} 个图片的 EXIF 数据`);

    while (this.loadingQueue.length > 0) {
      // 批量处理
      const batch = this.loadingQueue.splice(0, this.BATCH_SIZE);
      
      // 并行加载当前批次
      const promises = batch.map(async ({ img, exifUrl }) => {
        try {
          const imageSrc = img.src;
          const result = exifUrl 
            ? await loadExifData(exifUrl, imageSrc)
            : await loadExifFromSrc(imageSrc);
          
          console.log(`预加载完成: ${imageSrc.split('/').pop()}`);
          return result;
        } catch (error) {
          console.log(`预加载失败: ${img.src.split('/').pop()}`, error);
          // 即使失败也生成模拟数据并缓存
          const mockData = generateMockExifData(img.src);
          const cacheKey = exifUrl || img.src;
          exifCache.set(cacheKey, mockData);
          return mockData;
        }
      });

      // 等待当前批次完成
      await Promise.allSettled(promises);

      // 如果还有更多图片，等待一段时间再处理下一批
      if (this.loadingQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_BATCHES));
      }
    }

    this.isProcessing = false;
    console.log('所有 EXIF 数据预加载完成');
  }

  // 获取预加载器状态
  getStatus() {
    return {
      queueLength: this.loadingQueue.length,
      isProcessing: this.isProcessing,
      cacheSize: exifCache.size,
      processedCount: this.processedImages.size
    };
  }

  // 重置预加载器状态
  reset() {
    this.loadingQueue = [];
    this.processedImages.clear();
    this.isProcessing = false;
  }
}

// 创建全局预加载器实例
export const exifPreloader = new ExifPreloader();

/**
 * 初始化EXIF预加载
 */
export function initExifPreloading() {
  // 检查EXIF功能是否启用
  if (!SITE.imageConfig.exif.enabled) {
    return;
  }
  
  // 页面加载完成后开始预加载
  const startPreloading = () => {
    // 查找所有需要EXIF的图片
    const images = document.querySelectorAll('.img-main[data-show-exif="true"]') as NodeListOf<HTMLImageElement>;
    
    images.forEach((img) => {
      const exifUrl = img.getAttribute('data-exif-url');
      exifPreloader.addToQueue(img, exifUrl);
    });

    // 延迟启动预加载，确保不影响页面渲染
    setTimeout(() => {
      exifPreloader.startPreloading();
    }, 1000);
  };

  // 监听页面加载事件
  if (document.readyState === 'complete') {
    startPreloading();
  } else {
    window.addEventListener('load', startPreloading);
  }
}

/**
 * 监听新图片的动态加载（懒加载场景）
 */
export function observeNewImages() {
  // 检查EXIF功能是否启用
  if (!SITE.imageConfig.exif.enabled) {
    return;
  }
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // 检查新添加的图片
          const newImages = element.querySelectorAll('.img-main[data-show-exif="true"]') as NodeListOf<HTMLImageElement>;
          newImages.forEach((img) => {
            const exifUrl = img.getAttribute('data-exif-url');
            exifPreloader.addToQueue(img, exifUrl);
          });

          // 启动预加载
          if (newImages.length > 0 && !exifPreloader.getStatus().isProcessing) {
            setTimeout(() => {
              exifPreloader.startPreloading();
            }, 100);
          }
        }
      });
    });
  });

  // 开始观察DOM变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * 初始化所有EXIF功能
 */
export function initAllExifFeatures() {
  // 重置预加载器状态
  exifPreloader.reset();
  
  // 清理过期缓存
  exifCache.cleanup();
  
  // 初始化各项功能
  initExifTooltips();
  initExifPreloading();
  observeNewImages();
}

/**
 * 设置 EXIF 事件监听器
 */
export function setupExifListeners() {
  // 页面加载事件监听
  document.addEventListener('DOMContentLoaded', initAllExifFeatures);
  document.addEventListener('astro:page-load', initAllExifFeatures);

  // 开发调试：暴露预加载器到全局
  if (typeof window !== 'undefined') {
    (window as any).exifPreloader = exifPreloader;
  }
}

// 自动设置事件监听器
if (typeof document !== 'undefined') {
  setupExifListeners();
}