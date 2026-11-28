import { useState } from 'react';
import HelpTip from '../components/HelpTip';
import { Link } from '../utils/navigation';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'map-colors',
    category: '地図・マップ表示',
    question: '日本地図の色が変わる条件は何ですか？',
    answer:
      '地図右上の「📊 投稿件数（ON / OFF）」ボタンを押すと、都道府県マスの表示カラーを切り替えられます。OFFのときは地方ごとのカラフルな色分けで表示され、ONにすると投稿件数に応じたヒートマップ色（0件：グレー、1〜2件：ライトグリーン、3〜5件：グリーン、6〜10件：イエロー、11〜20件：オレンジ、21件以上：レッド）に変化します。マイページの「投稿マップ」でも自分の投稿件数に合わせて色が変わります。',
  },
  {
    id: 'main-sub-prefectures',
    category: '投稿作成・検索',
    question: '「メイン都道府県」と「サブ都道府県」の違いは何ですか？',
    answer:
      '「メイン都道府県」はそのドライブコースの中心となる都道府県（1つ必須）です。「サブ都道府県」は県境をまたぐロングドライブなどで経由・関連する都道府県を複数選択できる任意の項目です（メイン都道府県を選ぶとロックが解除されて選べるようになります）。サブ都道府県に登録した県も、地図の投稿件数カウントや投稿一覧の都道府県フィルター検索の対象に含まれます。',
  },
  {
    id: 'google-maps-url',
    category: 'ルート作成',
    question: 'GoogleマップのルートURLはどうやって貼り付けますか？',
    answer:
      'Googleマップで出発地・経由地・目的地を指定してルートを検索した状態で、ブラウザのアドレスバーに表示されているURL（https://www.google.com/maps/dir/...）をコピーし、投稿作成画面の「GoogleマップのルートURL」欄に貼り付けてください。標準の経路URLであれば、スタート・経由地・ゴール地点が自動で読み取られて上の入力欄に反映されます。スマホアプリ等の短縮URL（maps.app.goo.gl）の場合は地点名の自動抽出ができないため、上欄へ地点名を手入力してご登録ください。',
  },
  {
    id: 'likes-vs-favorites',
    category: 'いいね・お気に入り',
    question: '「いいね（♥）」と「お気に入り（★）」の違いは何ですか？',
    answer:
      '「いいね（♥）」は投稿を応援・評価するボタンで、押された数はランキングや地図上の人気ドライブコース（上位カード・都道府県No.1表示）、投稿者の「獲得いいね合計」に反映されます。「お気に入り（★）」は後から見返したいルートを自分用にブックマークする機能で、右上の三本バーメニュー内「お気に入り」ページからいつでも一覧で確認できます。',
  },
  {
    id: 'current-location-help',
    category: '位置情報・住所入力',
    question: '「現在地を取得」や地図の現在地表示がうまく動かない場合は？',
    answer:
      'ブラウザの位置情報アクセスが「許可しない」になっていると現在地を取得できません。ブラウザのサイト設定から位置情報の利用を許可して再度お試しください。もしGPSや位置情報が利用できない環境でも、スタート・中間・ゴール地点の「📮 郵便番号から住所を取得」欄に7桁の郵便番号を入力して検索するか、住所欄に直接入力して投稿できます。',
  },
  {
    id: 'edit-delete-post',
    category: '投稿の管理',
    question: '投稿したルートや写真は後から編集・削除できますか？',
    answer:
      'はい、ご自身が投稿したルートはいつでも編集・削除できます。マイページまたは投稿一覧から自分の投稿詳細ページを開き、タイトル横の「編集」ボタンを押すと、ルート情報・都道府県・テキスト・写真の追加や削除（最大10枚まで）を行えます。投稿自体を取り消したい場合は「削除」ボタンから削除できます。',
  },
  {
    id: 'follow-account-search',
    category: 'ユーザー・フォロー',
    question: '他のドライバーをフォローしたり検索したりできますか？',
    answer:
      'ログイン状態で右上の三本バーメニュー（☰）を開くと、下部に「アカウント検索」欄が表示されます。ユーザー名で検索してそのままフォローできるほか、投稿カードのユーザー名をクリックして相手のマイページを開くと、その人が走った日本地図や投稿一覧を見ながらフォロー・フォロー解除ができます。',
  },
  {
    id: 'map-controls-tips',
    category: '操作方法',
    question: 'パソコンとスマートフォンでの地図操作のコツは？',
    answer:
      'パソコンではマップをドラッグして移動、マウスホイールや右下の「＋」「ー」ボタンで拡大・縮小、都道府県マスにマウスカーソルを合わせるとその県の人気No.1ルートのミニポップアップが表示されます。スマートフォン・タブレットでは1本指ドラッグで移動、2本指でのピンチアウト／ピンチインで拡大・縮小でき、右下の「リセット」ボタンでいつでも全国表示に戻せます。',
  },
];

export default function FaqPage() {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set([FAQ_ITEMS[0].id]),
  );

  function toggleItem(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function openAll() {
    setOpenIds(new Set(FAQ_ITEMS.map((item) => item.id)));
  }

  function closeAll() {
    setOpenIds(new Set());
  }

  const allOpened = openIds.size === FAQ_ITEMS.length;

  return (
    <section className="faq-page">
      <div className="page-heading">
        <div className="heading-with-help">
          <h1>よくある質問（Q&A）</h1>
          <HelpTip
            title="よくある質問（Q&A）"
            description="ドライブマッピングの日本地図・ルート投稿・検索・お気に入りなどの使い方をまとめたガイドページです。"
            usage="気になる質問をクリックすると詳しい回答が開閉します。右上の「すべて開く／すべて閉じる」で一括切り替えもできます。"
          />
        </div>
      </div>

      <section className="panel faq-panel">
        <div className="faq-toolbar">
          <p className="faq-intro">
            日本地図の使い方やルート投稿・Googleマップ連携など、よくある疑問をまとめています。質問をクリックして回答をご覧ください。
          </p>
          <div className="faq-toolbar-actions">
            <button
              type="button"
              className="faq-toggle-all-btn"
              onClick={allOpened ? closeAll : openAll}
            >
              {allOpened ? 'すべて閉じる' : 'すべて開く'}
            </button>
          </div>
        </div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIds.has(item.id);
            const answerId = `faq-answer-${item.id}`;
            return (
              <div
                key={item.id}
                className={`faq-item ${isOpen ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  <span className="faq-q-badge" aria-hidden="true">
                    Q{index + 1}
                  </span>
                  <span className="faq-question-body">
                    <span className="faq-category-tag">{item.category}</span>
                    <span className="faq-question-text">{item.question}</span>
                  </span>
                  <span className="faq-chevron" aria-hidden="true">
                    {isOpen ? '−' : '＋'}
                  </span>
                </button>

                {isOpen && (
                  <div id={answerId} className="faq-answer-box">
                    <span className="faq-a-badge" aria-hidden="true">
                      A
                    </span>
                    <p className="faq-answer-text">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="faq-footer-links">
          <Link href="/" className="button">
            🗺️ トップ（日本地図）へ
          </Link>
          <Link href="/routes" className="button">
            🚩 投稿一覧を見る
          </Link>
          <Link href="/routes/new" className="button button-primary">
            ✏️ ルートを投稿する
          </Link>
        </div>
      </section>
    </section>
  );
}
