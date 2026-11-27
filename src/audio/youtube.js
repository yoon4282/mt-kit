// YouTube IFrame API 로 영상은 숨기고 소리만 재생. startSec 부터 정확히 durMs 만 재생 후 자동 정지.
let apiPromise = null;
let player = null;
let currentCancel = null;

function loadApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev && prev();
        resolve();
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => {
        apiPromise = null;
        reject(new Error('YouTube API 로드 실패'));
      };
      document.head.appendChild(s);
      setTimeout(() => reject(new Error('YouTube API 시간 초과')), 6000);
    });
  }
  return apiPromise;
}

function ensurePlayer() {
  return new Promise((resolve, reject) => {
    if (player) return resolve(player);
    let host = document.getElementById('yt-hidden');
    if (!host) {
      host = document.createElement('div');
      host.id = 'yt-hidden';
      // 화면 밖에 배치 (display:none 이면 일부 브라우저가 재생을 막는다)
      host.style.cssText = 'position:fixed;left:-9999px;top:0;width:220px;height:124px;opacity:0;pointer-events:none;';
      host.innerHTML = '<div id="yt-slot"></div>';
      document.body.appendChild(host);
    }
    const timer = setTimeout(() => reject(new Error('플레이어 준비 시간 초과')), 6000);
    player = new window.YT.Player('yt-slot', {
      width: 220, height: 124,
      playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, fs: 0 },
      events: {
        onReady: () => { clearTimeout(timer); resolve(player); },
        onError: () => { clearTimeout(timer); reject(new Error('플레이어 오류')); },
      },
    });
  });
}

export function stopYouTube() {
  if (currentCancel) currentCancel();
  try { player && player.pauseVideo && player.pauseVideo(); } catch { /* ignore */ }
}

// 성공하면 resolve('ok'), 재생 못 하면 reject → 호출자가 오프라인 멜로디로 대체
export async function playClip(videoId, startSec, durMs) {
  stopYouTube();
  await loadApi();
  const p = await ensurePlayer();
  return new Promise((resolve, reject) => {
    let done = false;
    let stopTimer = null;
    const startTimeout = setTimeout(() => finish(new Error('재생이 시작되지 않음')), 5000);
    const prevHandler = p.__handler;
    if (prevHandler) {
      p.removeEventListener('onStateChange', prevHandler);
      p.removeEventListener('onError', p.__errHandler);
    }
    const finish = (err) => {
      if (done) return;
      done = true;
      clearTimeout(startTimeout);
      clearTimeout(stopTimer);
      currentCancel = null;
      p.removeEventListener('onStateChange', onState);
      p.removeEventListener('onError', onErr);
      if (err) {
        try { p.pauseVideo(); } catch { /* ignore */ }
        reject(err);
      }
    };
    const onState = (e) => {
      if (e.data === window.YT.PlayerState.PLAYING && !stopTimer) {
        clearTimeout(startTimeout);
        stopTimer = setTimeout(() => {
          try { p.pauseVideo(); } catch { /* ignore */ }
          finish();
          resolve('ok');
        }, durMs);
      }
    };
    const onErr = () => finish(new Error('영상 재생 불가'));
    p.__handler = onState;
    p.__errHandler = onErr;
    p.addEventListener('onStateChange', onState);
    p.addEventListener('onError', onErr);
    currentCancel = () => finish(new Error('취소됨'));
    p.loadVideoById({ videoId, startSeconds: startSec });
  });
}
