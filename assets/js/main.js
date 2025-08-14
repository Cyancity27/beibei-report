/* ========= 1. 导航滚动 ========= */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = item.dataset.scroll;
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      // 移除其他导航项的活跃状态
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      // 添加当前项的活跃状态
      item.classList.add('active');

      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});


// ---------- 0. 扉页 (Cover Page) 交互 ----------
document.addEventListener('DOMContentLoaded', function() {
  const cover = document.getElementById('cover');
  if (!cover) return;

  // --- 爱心粒子效果 (已增强) ---
  const heartSvg = `
    <svg viewBox="0 0 24 22" class="love-bubble">
      <defs>
        <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#E85A7A;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#FF69B4;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#E7B5A1;stop-opacity:1" />
        </linearGradient>
      </defs>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="url(#heartGrad)"/>
    </svg>`;

  let lastTime = 0;
  // ↓↓↓↓↓↓ 核心修复点 2：增加粒子密度 ↓↓↓↓↓↓
  const throttleDelay = 10; // 减少节流延迟，允许更频繁地创建
  const creationProbability = 0.7; // 提高生成概率，现在有50%的几率生成
  // ↑↑↑↑↑↑ 核心修复点 2 结束 ↑↑↑↑↑↑

  const pathTypes = ['path-1', 'path-2', 'path-3', 'path-4', 'path-5'];

  cover.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastTime < throttleDelay) return;
    lastTime = now;

    // 使用新的概率值
    if (Math.random() > creationProbability) return;

    const bubble = document.createElement('div');
    bubble.innerHTML = heartSvg;
    document.body.appendChild(bubble.firstElementChild);

    const heart = document.body.lastElementChild;

    const randomPath = pathTypes[Math.floor(Math.random() * pathTypes.length)];
    heart.classList.add(randomPath);

    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 20;

    heart.style.left = `${e.clientX - 9 + offsetX}px`;
    heart.style.top = `${e.clientY - 8 + offsetY}px`;

    heart.addEventListener('animationend', () => {
      if (heart.parentNode) {
        heart.remove();
      }
    });
  });

  // --- 视频加载失败处理 ---
  const video = document.querySelector('.cover-video');
  const fallbackBg = document.querySelector('.cover-fallback-bg');

  if (video) {
    video.addEventListener('error', () => {
      // 视频加载失败，则隐藏视频，让备用背景完全显示
      video.style.display = 'none';
      if (fallbackBg) fallbackBg.style.opacity = '1';
    });

    // 视频可以播放时，隐藏备用背景
    video.addEventListener('canplay', () => {
      if (fallbackBg) fallbackBg.style.opacity = '0';
    });
  }
});


// 工具：fetch json
const load = name => fetch(`output/${name}.json`).then(r => r.json());

// ---------- 1. 初见时刻 (动态回放 - 最终版：修复音乐播放) ----------
document.addEventListener('DOMContentLoaded', () => {
    // --- 配置区 ---
    const INITIAL_SPEED = 1.0;

    // --- DOM元素获取 ---
    const chatWindow = document.getElementById('chatWindow');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    const bgm = document.getElementById('firstdayBgm');

    const ICONS = {
        PLAY: `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
        PAUSE: `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
    };

    let chatTimeline;
    let hasPlayedOnce = false;

    /**
     * 健壮的音乐播放函数，能处理浏览器自动播放限制
     */
    function playMusic() {
        if (!bgm) return;
        // audio.play() 返回一个Promise
        const promise = bgm.play();
        if (promise !== undefined) {
            promise.catch(error => {
                // 自动播放失败。这很正常，等待用户手动点击。
                console.log("背景音乐自动播放被浏览器阻止，等待用户交互。");
            });
        }
    }

    /**
     * 音乐暂停函数
     */
    function pauseMusic() {
        if (bgm) {
            bgm.pause();
        }
    }

    function createChatAnimation(chatData) {
        chatWindow.innerHTML = '';

        chatData.forEach((msg, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = `chat-bubble-wrapper ${msg.sender.toLowerCase()}`;
            wrapper.id = `msg-${index}`;
            wrapper.innerHTML = `
                <img src="${msg.avatar}" alt="${msg.sender}" class="avatar">
                <div class="chat-bubble">${msg.content}</div>
            `;
            chatWindow.appendChild(wrapper);
        });

        chatTimeline = gsap.timeline({
            paused: true,
            onComplete: () => {
                playPauseBtn.innerHTML = ICONS.PLAY;
                pauseMusic();
            }
        });

        chatData.forEach((msg, index) => {
            const bubbleId = `#msg-${index}`;
            const bubbleElement = document.querySelector(bubbleId);
            chatTimeline.to(bubbleId, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
            chatTimeline.to(chatWindow, {
                scrollTop: bubbleElement.offsetTop - chatWindow.clientHeight / 2 + bubbleElement.clientHeight / 2,
                duration: 0.5,
                ease: 'sine.inOut'
            }, "-=0.2");
        });

        playPauseBtn.innerHTML = ICONS.PLAY;
        speedSlider.value = INITIAL_SPEED;
        speedValue.textContent = `${INITIAL_SPEED.toFixed(1)}x`;
        if (chatTimeline) {
            chatTimeline.timeScale(INITIAL_SPEED);
        }
    }

    playPauseBtn.addEventListener('click', () => {
        if (!chatTimeline) return;

        if (chatTimeline.progress() === 1) {
            chatTimeline.restart();
            if(bgm) bgm.currentTime = 0;
            playMusic();
            playPauseBtn.innerHTML = ICONS.PAUSE;
            return;
        }
        if (chatTimeline.paused()) {
            chatTimeline.play();
            playMusic();
            playPauseBtn.innerHTML = ICONS.PAUSE;
        } else {
            chatTimeline.pause();
            pauseMusic();
            playPauseBtn.innerHTML = ICONS.PLAY;
        }
    });

    speedSlider.addEventListener('input', () => {
        const speed = parseFloat(speedSlider.value);
        if (chatTimeline) {
          chatTimeline.timeScale(speed);
        }
        speedValue.textContent = `${speed.toFixed(1)}x`;
    });

    ScrollTrigger.create({
        trigger: '#firstday',
        start: 'top 70%',
        end: 'bottom top',
        onEnter: () => {
            if (chatTimeline && !hasPlayedOnce) {
                chatTimeline.play();
                playMusic(); // 尝试播放音乐
                playPauseBtn.innerHTML = ICONS.PAUSE;
                hasPlayedOnce = true;
            }
        },
        onLeave: () => {
            if (chatTimeline && chatTimeline.isActive()) {
                chatTimeline.pause();
                pauseMusic();
                playPauseBtn.innerHTML = ICONS.PLAY;
            }
        },
        onLeaveBack: () => {
            if (chatTimeline && chatTimeline.isActive()) {
                chatTimeline.pause();
                pauseMusic();
                playPauseBtn.innerHTML = ICONS.PLAY;
            }
        }
    });

    fetch('output/first_day_chat.json')
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                createChatAnimation(data);
            } else {
                chatWindow.innerHTML = '<p style="text-align:center; color:#999;">未能加载聊天记录。</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching first day chat data:', error);
            chatWindow.innerHTML = '<p style="text-align:center; color:red;">加载聊天记录失败。</p>';
        });
});



// ---------- 2. 我们的故事星图 (豪华升级版) ----------
document.addEventListener('DOMContentLoaded', () => {
    // 使用 Promise.all 并行加载所有需要的数据
    Promise.all([
        fetch('outputs2/story_timeline.json').then(res => res.json()),
        fetch('outputs2/late_nights.json').then(res => res.json()),
        fetch('outputs2/sickness_events.json').then(res => res.json()),
        fetch('outputs2/her_preferences.json').then(res => res.json())
    ]).then(([timelineData, lateNightsData, sicknessData, preferencesData]) => {

        // 1. 填充关键数据卡片
        document.getElementById('lateNightCount').textContent = lateNightsData.count;
        document.getElementById('sicknessCount').textContent = sicknessData.count;

        // 2. 渲染她的喜好画廊
        const gallery = document.getElementById('preferencesGallery');
        gallery.innerHTML = '';
        for (const [category, items] of Object.entries(preferencesData)) {
            if (items.length > 0) {
                const card = document.createElement('div');
                card.className = 'preference-card';
                let itemsHtml = items.map(item => `<li>${item.content}<small>${item.timestamp}</small></li>`).join('');
                card.innerHTML = `<h4>${category}</h4><ul>${itemsHtml}</ul>`;
                gallery.appendChild(card);
            }
        }

        // 3. 渲染核心故事星图
        initStoryTimelineChart(timelineData);

    }).catch(error => {
        console.error("加载故事星图数据时出错:", error);
    });

    function initStoryTimelineChart(data) {
        const chart = echarts.init(document.getElementById('timelineChart'));
        const eventSymbolSize = 12; // 里程碑事件的标记大小

        const option = {
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    let date = params[0].axisValue;
                    let result = `${date}<br/>`;
                    params.forEach(param => {
                        if (param.seriesName === '聊天热度') {
                            result += `${param.marker} ${param.seriesName}: ${param.value[1]} 条<br/>`;
                        } else if (param.seriesName === '里程碑' || param.seriesName === '关心时刻') {
                            result += `${param.marker} ${param.seriesName}: ${param.data.description.replace('<br>', ' ')}<br/>`;
                        }
                    });
                    return result;
                }
            },
            legend: {
                data: ['聊天热度', '里程碑', '关心时刻'],
                textStyle: { color: '#fff' },
                bottom: 10
            },
            grid: { top: '10%', left: '5%', right: '5%', bottom: '15%' },
            xAxis: {
                type: 'time',
                axisLine: { lineStyle: { color: '#8282b2' } },
            },
            yAxis: {
                type: 'value',
                name: '消息条数',
                axisLine: { show: true, lineStyle: { color: '#8282b2' } },
                splitLine: { lineStyle: { color: '#3c3c5c' } }
            },
            dataZoom: [{ type: 'inside' }, { type: 'slider', backgroundColor: 'rgba(23,23,43,0.5)', fillerColor: 'rgba(231,181,161,0.2)' }],
            series: [
                {
                    name: '聊天热度',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { color: '#E7B5A1', width: 2, opacity: 0.8 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0, color: 'rgba(231, 181, 161, 0.4)'
                        }, {
                            offset: 1, color: 'rgba(231, 181, 161, 0.05)'
                        }])
                    },
                    data: data.base.map(d => [d.date, d.value])
                },
                {
                    name: '里程碑',
                    type: 'scatter',
                    symbol: 'pin',
                    symbolSize: eventSymbolSize * 2,
                    itemStyle: { color: '#ff6b81' }, // 醒目的红色
                    data: data.events.filter(e => e.type === 'milestone').map(e => ({
                        name: e.type,
                        value: [e.date, 0], // Y值设为0，使其出现在底部
                        description: e.description
                    }))
                },
                {
                    name: '关心时刻',
                    type: 'scatter',
                    symbol: 'circle',
                    symbolSize: eventSymbolSize,
                    itemStyle: { color: '#48dbfb' }, // 温柔的蓝色
                    data: data.events.filter(e => e.type === 'sickness').map(e => ({
                        name: e.type,
                        value: [e.date, 0],
                        description: e.description
                    }))
                }
            ]
        };

        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
    }
});

// ---------- 3. 数据爱意 ----------
//Promise.all([
//  load('stats'),
//  load('emojis'),
//  load('emotion')
//]).then(([stats, emojis, emotion]) => {
//  // 翻牌卡片
//  const cards = [
//    { front: '📩', back: `${stats.totalMsg}<br>条消息` },
//    { front: '📷', back: `${stats.totalImages}<br>张照片` },
//    { front: '🎥', back: `${stats.totalVideos}<br>段视频` },
//    { front: emojis[0]?.emoji || '❤️', back: `${emojis[0]?.count || 0}<br>次使用` }
//  ];
//  const flipContainer = document.getElementById('flipCards');
//  flipContainer.innerHTML = cards.map(c => `
//    <div class="flip-card">
//      <div class="flip-inner">
//        <div class="flip-front">${c.front}</div>
//        <div class="flip-back">${c.back}</div>
//      </div>
//    </div>
//  `).join('');
//
//  // 情感折线
//  const emoChart = echarts.init(document.getElementById('emotionChart'));
//  emoChart.setOption({
//    xAxis: { type: 'category', data: emotion.map(e => e.date) },
//    yAxis: { type: 'value', min: -1, max: 1 },
//    series: [{ type: 'line', data: emotion.map(e => e.score), smooth: true, color: '#C9B6D7' }]
//  });
//  window.addEventListener('resize', () => emoChart.resize());
//});

// ---------- 3. 数据爱意 (豪华版仪表盘) ----------

// 辅助函数：格式化数字（例如 12345 -> 1.2）
const formatWan = (num) => (num / 10000).toFixed(1);

// 渲染所有统计数据
function renderAllStats() {
    const dataFiles = [
        'stats', 'consecutive_chat', 'hourly_activity', 'love_language',
        'chat_initiator', 'question_asker', 'response_time', 'emotion', 'wordcloud'
    ];

    Promise.all(dataFiles.map(file => fetch(`outputs2/${file}.json`).then(r => r.json())))
        .then(data => {
            const [
                stats, consecutive, hourly, loveLang,
                initiator, question, response, emotion, wordcloud
            ] = data;

            // 1. 核心数据
            document.getElementById('totalDays').textContent = stats.totalDays;
            document.getElementById('totalMsg').textContent = stats.totalMsg;
            document.getElementById('totalWords').textContent = formatWan(stats.totalWords);
            document.getElementById('consecutiveDays').textContent = consecutive.days;

            // 2. 贡献对比
            const totalMsgs = stats.meMsgCount + stats.herMsgCount;
            const meMsgPercent = (stats.meMsgCount / totalMsgs * 100).toFixed(1);
            const herMsgPercent = (stats.herMsgCount / totalMsgs * 100).toFixed(1);
            document.getElementById('meMsgBar').style.width = `${meMsgPercent}%`;
            document.getElementById('herMsgBar').style.width = `${herMsgPercent}%`;
            document.getElementById('meMsgCount').textContent = stats.meMsgCount;
            document.getElementById('herMsgCount').textContent = stats.herMsgCount;

            const totalQuestions = question.me + question.her;
            const meQuestionPercent = (question.me / totalQuestions * 100).toFixed(1);
            const herQuestionPercent = (question.her / totalQuestions * 100).toFixed(1);
            document.getElementById('meQuestionBar').style.width = `${meQuestionPercent}%`;
            document.getElementById('herQuestionBar').style.width = `${herQuestionPercent}%`;
            document.getElementById('meQuestionCount').textContent = question.me;
            document.getElementById('herQuestionCount').textContent = question.her;

            // 3. 响应 & 发起者
            document.getElementById('herResponse').textContent = response.her;
            document.getElementById('meResponse').textContent = response.me;
            document.getElementById('herInitiator').textContent = initiator.her;
            document.getElementById('meInitiator').textContent = initiator.me;

            // 4. 初始化所有图表
            initHourlyChart(hourly);
            initRadarChart(loveLang.data, loveLang.indicator);
            initEmotionChart(emotion);
            initWordCloudChart(wordcloud);

            // 5. GSAP入场动画
            gsap.from(".stats-widget", {
                scrollTrigger: {
                    trigger: ".stats-dashboard",
                    start: "top 80%",
                },
                opacity: 0,
                y: 40,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            });
        })
        .catch(error => console.error("加载统计数据失败:", error));
}

// 初始化24小时热力图
function initHourlyChart(data) {
    const chart = echarts.init(document.getElementById('hourlyChart'));
    const option = {
        tooltip: {
            position: 'top',
            formatter: p => `时间: ${p.data[0]}点<br/>发送者: ${p.data[1] === 0 ? '我' : '你'}<br/>消息数: ${p.data[2]}`
        },
        grid: { height: '60%', top: '10%', left: '8%', right: '5%'},
        xAxis: { type: 'category', data: [...Array(24).keys()], splitArea: { show: true } },
        yAxis: { type: 'category', data: ['我', '你'], splitArea: { show: true } },
        visualMap: {
            min: 0, max: Math.max(...data.map(d=>d[2])),
            calculable: true, orient: 'horizontal', left: 'center', bottom: '2%',
            inRange: { color: ['#fdecf0', '#f8c4d3', '#e7b5a1', 'var(--rose)'] }
        },
        series: [{ type: 'heatmap', data: data, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } } }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

// 初始化爱情语言雷达图
function initRadarChart(data, indicator) {
    const chart = echarts.init(document.getElementById('radarChart'));
    const option = {
        color: ['#E7B5A1', '#C9B6D7'],
        tooltip: { trigger: 'item' },
        legend: { data: ['你', '我'], bottom: 0 },
        radar: { indicator: indicator, center: ['50%', '50%'], radius: '65%' },
        series: [{ type: 'radar', data: data }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

// 初始化情感曲线图 (已修改)
function initEmotionChart(data) {
    const chart = echarts.init(document.getElementById('emotionChart'));

    // ↓↓↓↓↓↓ 改进点：动态计算Y轴范围以放大波动 ↓↓↓↓↓↓
    const scores = data.map(e => e.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore;
    // 设置上下各 20% 的缓冲空间，让曲线不顶到边框
    const yAxisMin = Math.max(0, minScore - range * 0.2);
    const yAxisMax = Math.min(1, maxScore + range * 0.2);
    // ↑↑↑↑↑↑ 改进点：动态计算Y轴范围以放大波动 ↑↑↑↑↑↑

    const option = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: data.map(e => e.date), boundaryGap: false },
        yAxis: {
            type: 'value',
            min: yAxisMin.toFixed(2), // 应用计算出的最小值
            max: yAxisMax.toFixed(2)  // 应用计算出的最大值
        },
        series: [{
            name: '情感值', type: 'line', smooth: true,
            data: scores,
            color: '#C9B6D7',
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                    offset: 0, color: 'rgba(201, 182, 215, 0.5)'
                }, {
                    offset: 1, color: 'rgba(201, 182, 215, 0)'
                }])
            },
            markLine: { data: [{ type: 'average', name: '平均值' }] }
        }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

// 初始化词云图
function initWordCloudChart(data) {
    const chart = echarts.init(document.getElementById('wordCloudChart'));
    const option = {
        tooltip: { show: true, formatter: '{b}: {c}次' },
        series: [{
            type: 'wordCloud',
            shape: 'diamond',
            sizeRange: [12, 55],
            rotationRange: [-45, 45],
            textStyle: {
                color: () => 'rgb(' + [
                    Math.round(Math.random() * 160 + 50),
                    Math.round(Math.random() * 100 + 50),
                    Math.round(Math.random() * 100 + 50)
                ].join(',') + ')'
            },
            data: data
        }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}


// 在DOM加载完毕后执行渲染
document.addEventListener('DOMContentLoaded', renderAllStats);





// ---------- 4. 照片墙 ----------
//load('images').then(imgs => {
//  const html = imgs.map(src => `<img src="${src}" loading="lazy" />`).join('');
//  document.getElementById('galleryMacy').innerHTML = html;
//  Macy({ container: '#galleryMacy', trueOrder: false, margin: 24 });
//});

// ---------- 4. 照片墙（固定网格 + 无限轮播） ----------
// 定义每个区域的配置
const GALLERY_CONFIG = {
  food:   { total: 15 },
  people: { total: 8  },
  object: { total: 5  }
};

// 用于存储每个区域的状态
const galleryState = {
  food:   { currentIndex: 0, photos: [] },
  people: { currentIndex: 0, photos: [] },
  object: { currentIndex: 0, photos: [] }
};

/**
 * 生成一个介于 min 和 max 之间的随机数
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const randomInRange = (min, max) => Math.random() * (max - min) + min;

/**
 * 为指定区域更新照片拼贴墙
 * @param {string} zone - 'food', 'people', or 'object'
 */
function updateGalleryZone(zone) {
  const config = GALLERY_CONFIG[zone];
  const state = galleryState[zone];
  const grid = document.querySelector(`.grid-${zone}`);

  if (!grid || state.photos.length === 0) return;

  // 1. 计算要显示的图片切片
  const startIndex = state.currentIndex;
  const endIndex = startIndex + config.total;
  let newPhotos = state.photos.slice(startIndex, endIndex);

  // 2. 处理循环：如果到达末尾，从头开始补齐
  if (newPhotos.length < config.total) {
    const remaining = config.total - newPhotos.length;
    newPhotos = newPhotos.concat(state.photos.slice(0, remaining));
  }

  // 3. 生成带随机样式的图片HTML
  const imagesHtml = newPhotos.map((p, index) => {
    // 随机化样式，创造拼贴效果
    const style = `
      z-index: ${index};
      width: ${randomInRange(30, 60)}%;
      top: ${randomInRange(-15, 75)}%;
      left: ${randomInRange(-15, 75)}%;
      transform: rotate(${randomInRange(-20, 20)}deg);
    `;
    return `<img src="${p.src}" alt="照片" style="${style}">`;
  }).join('');

  grid.innerHTML = imagesHtml;

  // 4. 更新下一次开始的索引，并处理循环
  // 使用 slice 的长度来前进，确保在列表末尾也能正确衔接
  state.currentIndex = (startIndex + newPhotos.length) % state.photos.length;
}

// 1. 加载所有 JSON 数据
Promise.all(
  ['food', 'people', 'object'].map(z => fetch(`output/gallery_${z}_dated.json`).then(r => r.json()))
).then(datas => {
  // 2. 初始化每个区域的数据
  ['food', 'people', 'object'].forEach((zone, i) => {
    const sortedPhotos = datas[i].sort((a, b) => new Date(a.date) - new Date(b.date));
    galleryState[zone].photos = sortedPhotos;
    // 首次渲染
    updateGalleryZone(zone);
  });

  // 3. 启动全局定时器，每隔一段时间刷新所有区域
  setInterval(() => {
    ['food', 'people', 'object'].forEach(zone => {
      const grid = document.querySelector(`.grid-${zone}`);
      if (grid) {
        // 先淡出
        grid.style.opacity = '0';
        // 在淡出动画结束后更新内容并淡入，视觉效果更佳
        setTimeout(() => {
          updateGalleryZone(zone);
          grid.style.opacity = '1';
        }, 500); // 这个时间应与 CSS transition 的时间匹配
      }
    });
  }, 2500); // 4秒刷新一次，给用户足够的时间欣赏，同时保持动态感
});



// ---------- 5. 声与影 (最终版：修复+数字分页) ----------
// ---------- 5. 声与影 (最终修复美化版) ----------
document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        fetch('outputs3/voices_list.json').then(res => res.json()).catch(() => []),
        fetch('outputs3/videos.json').then(res => res.json()).catch(() => []),
        fetch('outputs3/video_stats.json').then(res => res.json()).catch(() => null),
        fetch('outputs3/audio_stats.json').then(res => res.json()).catch(() => null)
    ]).then(([voices, videos, videoStats, audioStats]) => {
        if (videoStats) renderMediaStats('video', videoStats);
        if (audioStats) renderMediaStats('audio', audioStats);
        if (videos && videos.length > 0) renderVideoCinema(videos);
        if (voices && voices.length > 0) renderVoiceWallWithPagination(voices);
    }).catch(error => console.error("加载声与影数据失败:", error));

    function renderMediaStats(type, stats) {
        document.getElementById(`${type}CountTotal`).textContent = stats.count;
        document.getElementById(`${type}AvgDuration`).textContent = `${stats.average_duration_seconds}s`;
        document.getElementById(`${type}MaxDuration`).textContent = `${stats.max_duration_seconds}s`;
        const poeticBlock = document.getElementById(`${type}PoeticText`);
        if (type === 'video') {
            poeticBlock.innerHTML = `这 2.4 小时，<br>相当于地球自转了整整一圈半，<br>也等于国际空间站绕地球飞了23圈，<br>或是让一朵昙花连续绽放了2160回。`;
        } else {
            poeticBlock.innerHTML = `这 ${stats.total_duration_hours} 小时，<br>足以让一只蜂鸟振翅777万6000次，<br>让一束光往返地球与月球之间29个来回，<br>也足够让一粒橡子长成可俯瞰森林的小树。`;
        }
        const chartContainer = document.getElementById(`${type}HistogramChart`);
        if (!chartContainer) return;
        const chart = echarts.init(chartContainer);
        chart.setOption({
            grid: { top: 20, bottom: 30, left: 40, right: 20 },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: stats.histogram.map(h => h.range), axisLabel: { color: '#a9a9d4'} },
            yAxis: { type: 'value', axisLabel: { color: '#a9a9d4' }, splitLine: { lineStyle: { color: '#3c3c5c' } } },
            series: [{ type: 'bar', data: stats.histogram.map(h => h.count), itemStyle: { color: type === 'video' ? '#E7B5A1' : '#C9B6D7' } }]
        });
    }

    function renderVideoCinema(videos) {
        const filmStrip = document.getElementById('filmStrip');
        const mainPlayerContainer = document.getElementById('mainPlayerContainer');
        const videoContext = document.getElementById('videoContext');
        let currentPlyrInstance = null;

        function loadVideo(videoData, thumbElement) {
            document.querySelectorAll('.film-strip-item.active').forEach(item => item.classList.remove('active'));
            if (thumbElement) thumbElement.classList.add('active');
            if (currentPlyrInstance) currentPlyrInstance.destroy();
            mainPlayerContainer.innerHTML = `<video class="plyr-video-player" autoplay controls><source src="${videoData.src}" type="video/mp4"></video>`;
            currentPlyrInstance = new Plyr('.plyr-video-player');

            videoContext.innerHTML = videoData.context.map(msg => {
                // ↓↓↓↓↓↓ 核心改进点：为头像路径定义变量，避免硬编码 ↓↓↓↓↓↓
                const ME_AVATAR = './assets/media/logo/me.jpg';
                const HER_AVATAR = './assets/media/logo/her.jpg';

                const senderClass = msg.sender.toLowerCase();
                const avatarSrc = senderClass === 'me' ? ME_AVATAR : HER_AVATAR;
                const sanitizedContent = msg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

                if (msg.type === 'video') {
                    return `<div class="context-message video-placeholder">[ 视频发送于此刻 ]</div>`;
                }

                return `
                    <div class="context-message-wrapper ${senderClass}">
                        <img src="${avatarSrc}" alt="${msg.sender}" class="avatar">
                        <div class="content-bubble">${sanitizedContent}</div>
                    </div>
                `;
            }).join('');
        }

        // 渲染胶片带（此逻辑本身是正确的）
        videos.forEach(videoData => {
            const thumbItem = document.createElement('div');
            thumbItem.className = 'film-strip-item';
            thumbItem.innerHTML = `<img src="${videoData.thumbnail}" alt="视频缩略图" loading="lazy">`;
            thumbItem.addEventListener('click', () => loadVideo(videoData, thumbItem));
            filmStrip.appendChild(thumbItem);
        });

        if (filmStrip.children.length > 0) {
            loadVideo(videos[0], filmStrip.children[0]);
        }
    }

    function renderVoiceWallWithPagination(voices) {
        const voiceWall = document.getElementById('voiceWall');
        const paginationControls = document.getElementById('voicePagination');
        const globalPlayer = document.getElementById('globalAudioPlayer');

        let currentPage = 1;
        const itemsPerPage = 20;
        const totalPages = Math.ceil(voices.length / itemsPerPage);
        let currentPlaying = { button: null, card: null };

        function renderPage(page) {
            currentPage = page;
            voiceWall.innerHTML = '';

            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = voices.slice(startIndex, endIndex);

            pageItems.forEach(voiceData => {
                const card = document.createElement('div');
                card.className = 'voice-card';
                const waveformContainer = document.createElement('div');
                waveformContainer.className = 'waveform-container';
                waveformContainer.innerHTML = voiceData.waveform.map(val => `<div class="waveform-bar" style="height: ${Math.max(2, val * 100)}%"></div>`).join('');

                card.innerHTML = `
                    <button class="voice-play-btn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>
                    <div class="waveform-wrapper"></div>
                    <div class="voice-duration">${voiceData.duration}</div>
                `;
                card.querySelector('.waveform-wrapper').appendChild(waveformContainer);
                voiceWall.appendChild(card);

                const playBtn = card.querySelector('.voice-play-btn');
                playBtn.addEventListener('click', () => {
                    if (currentPlaying.card === card && !globalPlayer.paused) {
                        globalPlayer.pause();
                    } else {
                        if (currentPlaying.button) { currentPlaying.button.classList.remove('playing'); }
                        globalPlayer.src = voiceData.src;
                        globalPlayer.play();
                        currentPlaying = { button: playBtn, card: card };
                    }
                });
            });
            renderPaginationControls();
        }

        function renderPaginationControls() {
            paginationControls.innerHTML = '';
            // ↓↓↓↓↓↓ 核心改进点：使用更具设计感的箭头作为翻页按钮 ↓↓↓↓↓↓
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pagination-btn';
            prevBtn.innerHTML = `&lt;`; // 左箭头
            prevBtn.disabled = currentPage === 1;
            prevBtn.addEventListener('click', () => renderPage(currentPage - 1));
            paginationControls.appendChild(prevBtn);

            const pagesContainer = document.createElement('div');
            pagesContainer.className = 'pagination-pages';
            // 优化分页显示逻辑，避免页码过多
            const pageRange = 2;
            let start = Math.max(1, currentPage - pageRange);
            let end = Math.min(totalPages, currentPage + pageRange);

            if (start > 1) {
                const firstBtn = document.createElement('button');
                firstBtn.className = 'page-btn';
                firstBtn.textContent = '1';
                firstBtn.addEventListener('click', () => renderPage(1));
                pagesContainer.appendChild(firstBtn);
                if (start > 2) pagesContainer.insertAdjacentHTML('beforeend', `<span>...</span>`);
            }

            for (let i = start; i <= end; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn';
                if (i === currentPage) pageBtn.classList.add('active');
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => renderPage(i));
                pagesContainer.appendChild(pageBtn);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) pagesContainer.insertAdjacentHTML('beforeend', `<span>...</span>`);
                const lastBtn = document.createElement('button');
                lastBtn.className = 'page-btn';
                lastBtn.textContent = totalPages;
                lastBtn.addEventListener('click', () => renderPage(totalPages));
                pagesContainer.appendChild(lastBtn);
            }

            paginationControls.appendChild(pagesContainer);

            const nextBtn = document.createElement('button');
            nextBtn.className = 'pagination-btn';
            nextBtn.innerHTML = `&gt;`; // 右箭头
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.addEventListener('click', () => renderPage(currentPage + 1));
            paginationControls.appendChild(nextBtn);
        }

        renderPage(1);

        globalPlayer.addEventListener('play', () => { if (currentPlaying.button) currentPlaying.button.classList.add('playing'); });
        globalPlayer.addEventListener('pause', () => { if (currentPlaying.button) currentPlaying.button.classList.remove('playing'); });
        globalPlayer.addEventListener('ended', () => {
            if (currentPlaying.button) { currentPlaying.button.classList.remove('playing'); }
            currentPlaying = { button: null, card: null };
        });
        globalPlayer.addEventListener('timeupdate', () => {
            if (!currentPlaying.card || !globalPlayer.duration) return;
            const percent = globalPlayer.currentTime / globalPlayer.duration;
            const bars = currentPlaying.card.querySelectorAll('.waveform-bar');
            bars.forEach((bar, index) => {
                bar.classList.toggle('played', index / bars.length < percent);
            });
        });
    }

    document.querySelectorAll('.media-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const globalPlayer = document.getElementById('globalAudioPlayer');
            if (globalPlayer) globalPlayer.pause();
            const videoPlayer = document.querySelector('.plyr-video-player');
            if (videoPlayer && videoPlayer.plyr) videoPlayer.plyr.pause();
            document.querySelectorAll('.media-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.media-panels .panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + 'Panel').classList.add('active');
        });
    });
});


// ---------- 6. 手写信 ----------
fetch('output/letter.svg')   // 你可以把 SVG 手写内容放这里
  .then(r => r.text())
  .then(svg => document.getElementById('handwriteSvg').innerHTML = svg);

/* ========= 9. GSAP 滚动动画 ========= */
gsap.registerPlugin(ScrollTrigger);
gsap.utils.toArray('.section').forEach(sec=>{
  gsap.from(sec,{y:80,opacity:0,duration:1,scrollTrigger:{trigger:sec,start:'top 80%'}});
});