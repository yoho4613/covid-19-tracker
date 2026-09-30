import { CONFIG } from '../config.ts';
import { Stage, type Game } from '../game/engine.ts';
import { FollowGame } from '../game/follow.ts';
import { LureGame } from '../game/lure.ts';
import type { GameId, GameResult } from '../game/tiers.ts';
import { mountAd } from '../lib/ads.ts';
import { submitPlay } from '../lib/api.ts';
import { track } from '../lib/track.ts';
import { GAME_NAMES, copyText, kakaoShare, loadKakao, makeCard, saveCard, shareLink, shareText, shareUrl } from '../lib/share.ts';

interface GameInfo {
  emoji: string;
  rules: string[];
  make(onFinish: (r: GameResult) => void): Game;
}

const GAMES: Record<GameId, GameInfo> = {
  lure: {
    emoji: '🐟',
    rules: [
      '물을 톡 누르면 먹이가 떨어져요.',
      '부캉이는 가까운 먹이를 따라 헤엄쳐요. 먹이로 길을 만들어 맨 위 바다까지 데려가세요.',
      '먹이는 14개, 제한 시간은 45초. 부캉이가 가끔 버티기를 써요!',
    ],
    make: (cb) => new LureGame(cb),
  },
  follow: {
    emoji: '🎯',
    rules: [
      '손가락(마우스)을 부캉이 위에 올리고 30초 동안 따라가세요.',
      '갈수록 빨라지고, 가끔 휙 돌진하거나 잠수해요.',
      '부캉이 위에 있었던 시간이 추적률이 돼요.',
    ],
    make: (cb) => new FollowGame(cb),
  },
};

export class GameView {
  private stage: Stage | null = null;
  private current: GameId | null = null;
  private readonly overlay: HTMLElement;
  private readonly title: HTMLElement;
  private readonly stageHost: HTMLElement;

  constructor(private readonly root: HTMLElement) {
    this.overlay = root.querySelector('#overlay')!;
    this.title = root.querySelector('#game-title')!;
    this.stageHost = root.querySelector('#stage')!;
  }

  open(id: GameId): void {
    this.root.hidden = false;
    this.current = id;
    this.title.textContent = GAME_NAMES[id];
    this.stage ??= new Stage(this.stageHost);
    this.stage.stop();
    this.showIntro(id);
  }

  close(): void {
    this.stage?.stop();
    this.current = null;
    this.root.hidden = true;
  }

  private showIntro(id: GameId): void {
    const info = GAMES[id];
    this.overlay.hidden = false;
    this.overlay.innerHTML = `<div class="sheet intro">
      <p class="sheet-emoji" aria-hidden="true">${info.emoji}</p>
      <h2>${GAME_NAMES[id]}</h2>
      <ol class="rules">${info.rules.map((r) => `<li>${r}</li>`).join('')}</ol>
      <button class="btn primary big" type="button" data-act="start">시작하기</button>
      <p class="fine">게임 속 이야기예요. 실제 부캉이에게는 먹이를 주거나 다가가면 안 돼요.</p>
    </div>`;
    this.overlay.querySelector<HTMLButtonElement>('[data-act="start"]')!.onclick = () => this.start(id);
  }

  private start(id: GameId): void {
    this.overlay.hidden = true;
    this.overlay.innerHTML = '';
    track('play_start', { game: id });
    this.stage!.run(GAMES[id].make((r) => this.finish(r)));
  }

  private finish(r: GameResult): void {
    if (this.current !== r.game) return;
    track('play_end', { game: r.game, tier: r.tier.name });
    // 결과 연출이 잠깐 보이도록 조금 늦게 띄운다
    setTimeout(() => {
      if (this.current === r.game) void this.showResult(r);
    }, 450);
  }

  private async showResult(r: GameResult): Promise<void> {
    const other: GameId = r.game === 'lure' ? 'follow' : 'lure';
    const score =
      r.game === 'follow'
        ? `${r.score}<small>%</small>`
        : r.score === null
          ? `버팀!<small> 45초 경과</small>`
          : `${r.score.toFixed(1)}<small>초</small>`;
    this.overlay.hidden = false;
    this.overlay.innerHTML = `<div class="sheet result">
      <p class="eyebrow">${GAME_NAMES[r.game]} 결과</p>
      <p class="result-score">${score}</p>
      <p class="result-tier">${r.tier.name}</p>
      <p class="result-desc">${r.tier.desc}</p>
      <p class="result-rank" hidden></p>
      <div class="actions">
        <button class="btn primary big" type="button" data-act="share">친구에게 자랑하기</button>
        <button class="btn kakao" type="button" data-act="kakao" hidden>카카오톡으로 보내기</button>
        <div class="row">
          <button class="btn" type="button" data-act="save" disabled>이미지 저장</button>
          <button class="btn" type="button" data-act="copy">링크 복사</button>
        </div>
        <div class="row">
          <button class="btn ghost" type="button" data-act="retry">다시 하기</button>
          <a class="btn ghost" href="#/${other}">${GAME_NAMES[other]}</a>
        </div>
        <a class="btn text" href="#/">트래커로 돌아가기</a>
      </div>
      <p class="toast" role="status" aria-live="polite"></p>
      <div class="ad-slot"></div>
    </div>`;

    const $ = <T extends HTMLElement>(sel: string) => this.overlay.querySelector<T>(sel)!;
    const toast = (msg: string) => {
      const t = $('.toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 1800);
    };
    let topPercent: number | null = null;
    let card: Blob | null = null;

    $('[data-act="retry"]').onclick = () => this.start(r.game);
    $('[data-act="share"]').onclick = async () => {
      const how = await shareLink(r);
      if (how === 'copied') toast('링크를 복사했어요. 친구에게 붙여넣어 보내세요!');
      if (how !== 'cancelled') track('share', { game: r.game, method: how });
    };
    $('[data-act="copy"]').onclick = async () => {
      if (await copyText(`${shareText(r)}\n${shareUrl(r)}`)) {
        toast('링크를 복사했어요!');
        track('share', { game: r.game, method: 'copy' });
      }
    };
    const saveBtn = $<HTMLButtonElement>('[data-act="save"]');
    saveBtn.onclick = () => {
      if (!card) return;
      void saveCard(card);
      track('share', { game: r.game, method: 'image' });
    };

    const kakao = loadKakao();
    if (kakao) {
      kakao
        .then((K) => {
          const btn = $('[data-act="kakao"]');
          btn.hidden = false;
          btn.onclick = () => {
            kakaoShare(K, r);
            track('share', { game: r.game, method: 'kakao' });
          };
        })
        .catch(() => {});
    }

    mountAd($('.ad-slot'), CONFIG.adfit.result);

    const played = await submitPlay(r.game, r.score);
    if (played?.topPercent != null && this.overlay.contains(saveBtn)) {
      topPercent = played.topPercent;
      const rank = $('.result-rank');
      rank.textContent = `전국 상위 ${topPercent}%`;
      rank.hidden = false;
    }
    card = await makeCard(r, topPercent);
    if (card && this.overlay.contains(saveBtn)) saveBtn.disabled = false;
  }
}
