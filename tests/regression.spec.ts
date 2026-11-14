import { expect, test, type Page } from '@playwright/test';

const userId = '11111111-1111-4111-8111-111111111111';
const user = {
  id: userId,
  email: 'review@example.test',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: { provider: 'email' },
  user_metadata: { name: 'Review' },
  created_at: '2026-01-01T00:00:00Z',
};

function makeRoute(id: number, code: number, title: string, likes = 0) {
  return {
    id, user_id: userId, title, prefecture_code: code,
    summary: null, description: null, address: null, site_url: null,
    google_maps_url: null, created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    route_points: [], route_photos: [], route_prefectures: [],
    route_likes: Array.from({ length: likes }, () => ({ user_id: userId })),
  };
}

async function mockApi(page: Page, options: { liked?: boolean; slowTokyo?: boolean } = {}) {
  const state = {
    failFavorite: true,
    writes: [] as string[],
    queries: [] as URL[],
    routes: [
      makeRoute(1, 13, '東京のルート', options.liked ? 1 : 0),
      makeRoute(2, 14, '神奈川のルート'),
    ],
  };
  await page.route('http://127.0.0.1:41749/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const reply = (data: unknown, status = 200) => route.fulfill({
      status, contentType: 'application/json', body: JSON.stringify(data),
    });
    if (url.pathname === '/auth/v1/token') {
      return reply({
        access_token: 'test-access-token', refresh_token: 'test-refresh-token',
        token_type: 'bearer', expires_in: 3600, user,
      });
    }
    if (url.pathname === '/auth/v1/user') return reply(user);
    if (url.pathname === '/rest/v1/profiles') {
      return reply([{ id: userId, name: 'Review', bio: null, avatar_path: null }]);
    }
    if (url.pathname === '/rest/v1/profile_follows') return reply([]);
    if (url.pathname === '/rest/v1/route_likes') {
      state.writes.push(request.method());
      if (state.failFavorite) return reply({ message: '保存できませんでした', code: '42501' }, 403);
      state.routes[0].route_likes = request.method() === 'POST' ? [{ user_id: userId }] : [];
      return reply([]);
    }
    if (url.pathname === '/rest/v1/routes') {
      state.queries.push(url);
      if (options.slowTokyo && url.searchParams.get('prefecture_code') === 'eq.13') {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      let rows = state.routes;
      for (const key of ['id', 'prefecture_code'] as const) {
        const value = url.searchParams.get(key);
        if (value) rows = rows.filter((row) => String(row[key]) === value.replace('eq.', ''));
      }
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = Number(url.searchParams.get('limit') || rows.length);
      rows = rows.slice(offset, offset + limit);
      return reply(rows);
    }
    throw new Error(`Unexpected API request: ${request.method()} ${url}`);
  });
  return state;
}

test('戻る・進むでURL、検索入力、投稿一覧が同期する', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/routes?prefecture_code=13&user_id=${userId}&q=ルート`);
  await expect(page.getByText('東京のルート', { exact: true })).toBeVisible();
  await page.locator('.search select').selectOption('14');
  await page.locator('.search input').fill('ドライブ');
  await page.locator('.search button').click();
  await expect(page.getByText('神奈川のルート', { exact: true })).toBeVisible();
  expect(state.queries.at(-1)?.searchParams.get('or')).toContain('title.ilike.%ドライブ%');

  await page.goBack();
  await expect(page.locator('.search select')).toHaveValue('13');
  await expect(page.locator('.search input')).toHaveValue('ルート');
  await expect(page.getByText('東京のルート', { exact: true })).toBeVisible();
  expect(state.queries.at(-1)?.searchParams.get('user_id')).toBe(`eq.${userId}`);

  await page.goForward();
  await expect(page.locator('.search select')).toHaveValue('14');
  await expect(page.locator('.search input')).toHaveValue('ドライブ');
  await expect(page.getByText('神奈川のルート', { exact: true })).toBeVisible();
});

test('古い検索レスポンスが新しい検索結果を上書きしない', async ({ page }) => {
  await mockApi(page, { slowTokyo: true });
  await page.goto('/routes?prefecture_code=13');
  await page.locator('.search select').selectOption('14');
  await page.locator('.search button').click();
  await expect(page.getByText('神奈川のルート', { exact: true })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('東京のルート', { exact: true })).toHaveCount(0);
  await expect(page.getByText('神奈川のルート', { exact: true })).toBeVisible();
});

for (const liked of [false, true]) {
  test(`お気に入り${liked ? '解除' : '保存'}失敗を表示し、再試行できる`, async ({ page }) => {
    const state = await mockApi(page, { liked });
    await page.goto('/login?returnTo=%2Froutes%2F1');
    await page.getByLabel('メールアドレス', { exact: true }).fill(user.email);
    await page.getByLabel('パスワード', { exact: true }).fill('review-password');
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();
    await expect(page).toHaveURL(/\/routes\/1$/);

    const initialName = liked ? 'お気に入り解除 (1)' : 'お気に入り (0)';
    const button = page.getByRole('button', { name: initialName, exact: true });
    await button.click();
    await expect(page.getByRole('alert')).toHaveText('保存できませんでした');
    await expect(page.getByRole('heading', { name: '東京のルート' })).toBeVisible();
    await expect(button).toBeEnabled();
    expect(state.writes).toEqual([liked ? 'DELETE' : 'POST']);

    state.failFavorite = false;
    await button.click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', {
      name: liked ? 'お気に入り (0)' : 'お気に入り解除 (1)', exact: true,
    })).toBeEnabled();
  });
}

test('メニューのカスタムクリックでもSPA遷移と認証復帰先を維持する', async ({ page }) => {
  await mockApi(page);
  await page.goto('/routes?prefecture_code=13');
  await page.evaluate(() => { document.body.dataset.navigationMarker = 'same-document'; });
  await page.getByRole('button', { name: 'メニューを開く' }).click();
  await page.getByRole('link', { name: 'ログイン', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await expect(page.locator('body')).toHaveAttribute('data-navigation-marker', 'same-document');
  await expect(page.locator('.auth-dropdown-menu')).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/routes?prefecture_code=13');
});

test('地図は全都道府県と既存スキーマからの人気順表示を維持する', async ({ page }) => {
  const state = await mockApi(page);
  state.routes = Array.from({ length: 1000 }, (_, index) => makeRoute(index + 1, 13, `東京${index}`));
  state.routes.push(makeRoute(1001, 14, '人気ルート', 3));
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('.map-top-popup')).toHaveCount(2);
  await expect(page.locator('.popup-title').first()).toHaveText('人気ルート');
  expect(state.queries.some((url) => url.searchParams.get('offset') === '1000')).toBe(true);
  expect(state.queries.every((url) => {
    const select = url.searchParams.get('select') || '';
    return select.includes('route_likes(user_id)') && !select.includes('photo_path') && !select.includes('like_count');
  })).toBe(true);
  const codes = await page.locator('polygon').evaluateAll((polygons) => polygons.map((polygon) => polygon.getAttribute('data-pref')));
  expect(new Set(codes).size).toBe(47);
  await page.getByRole('button', { name: '投稿件数 OFF' }).click();
  await expect(page.getByRole('button', { name: '投稿件数 ON' })).toHaveAttribute('aria-pressed', 'true');
  const stage = page.locator('.dm-map-stage');
  await page.locator('.dm-map-viewport').dispatchEvent('wheel', { deltaY: -100 });
  await expect(stage).toHaveAttribute('style', /scale\(1\.12\)/);
  expect(consoleErrors).toEqual([]);
  await page.getByRole('button', { name: 'リセット' }).click();
  await expect(stage).toHaveAttribute('style', /scale\(1\)/);
  await page.locator('polygon[data-pref="14"]').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/prefecture_code=14/);
});
