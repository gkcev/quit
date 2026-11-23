// Uygulamanın sabit içerikleri: sağlık kilometre taşları, rozetler, öneriler.

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

// Kaynak: WHO ve ACS'nin sigarayı bırakmanın faydaları listeleri (genel bilgi, tıbbi tavsiye değildir).
export const MILESTONES = [
  { id: 'm20', after: 20 * MIN, title: '20 dakika', text: 'Nabzın ve tansiyonun düşmeye başlar.' },
  { id: 'h12', after: 12 * HOUR, title: '12 saat', text: 'Kandaki karbonmonoksit seviyesi normale iner.' },
  { id: 'h48', after: 48 * HOUR, title: '48 saat', text: 'Sinir uçları onarılmaya başlar; tat ve koku alma güçlenir.' },
  { id: 'h72', after: 72 * HOUR, title: '72 saat', text: 'Bronşlar gevşer, nefes almak kolaylaşır.' },
  { id: 'w2', after: 2 * WEEK, title: '2 hafta', text: 'Dolaşımın iyileşir, yürümek ve egzersiz kolaylaşır.' },
  { id: 'w12', after: 12 * WEEK, title: '12 hafta', text: 'Akciğer fonksiyonun belirgin şekilde artar.' },
  { id: 'mo9', after: 9 * MONTH, title: '9 ay', text: 'Öksürük ve nefes darlığı azalır; akciğerler kendini temizlemeye başlar.' },
  { id: 'y1', after: YEAR, title: '1 yıl', text: 'Koroner kalp hastalığı riskin, içen birine göre yarıya iner.' },
  { id: 'y5', after: 5 * YEAR, title: '5 yıl', text: 'İnme riskin, hiç içmemiş birinin seviyesine yaklaşır.' },
  { id: 'y10', after: 10 * YEAR, title: '10 yıl', text: 'Akciğer kanseri riskin, içen birine göre yaklaşık yarıya iner.' },
  { id: 'y15', after: 15 * YEAR, title: '15 yıl', text: 'Kalp hastalığı riskin, hiç içmemiş birininkiyle aynı olur.' },
];

// type: time (ms) | money (para birimi) | cravings (atlatılan kriz sayısı)
// icon: index.html'deki SVG sprite'ındaki sembol adı. label: rozet kutucuğundaki kısa ad.
export const BADGES = [
  { id: 't1d', type: 'time', goal: DAY, icon: 'leaf', label: '1 gün', title: '1 gün' },
  { id: 't3d', type: 'time', goal: 3 * DAY, icon: 'leaf', label: '3 gün', title: '3 gün' },
  { id: 't1w', type: 'time', goal: WEEK, icon: 'star', label: '1 hafta', title: '1 hafta' },
  { id: 't2w', type: 'time', goal: 2 * WEEK, icon: 'star', label: '2 hafta', title: '2 hafta' },
  { id: 't1m', type: 'time', goal: MONTH, icon: 'star', label: '1 ay', title: '1 ay' },
  { id: 't3m', type: 'time', goal: 3 * MONTH, icon: 'award', label: '3 ay', title: '3 ay' },
  { id: 't6m', type: 'time', goal: 6 * MONTH, icon: 'award', label: '6 ay', title: '6 ay' },
  { id: 't1y', type: 'time', goal: YEAR, icon: 'award', label: '1 yıl', title: '1 yıl' },
  { id: 'p100', type: 'money', goal: 100, icon: 'coins', label: '₺100', title: '₺100 tasarruf' },
  { id: 'p500', type: 'money', goal: 500, icon: 'coins', label: '₺500', title: '₺500 tasarruf' },
  { id: 'p1k', type: 'money', goal: 1000, icon: 'coins', label: '₺1.000', title: '₺1.000 tasarruf' },
  { id: 'p5k', type: 'money', goal: 5000, icon: 'coins', label: '₺5.000', title: '₺5.000 tasarruf' },
  { id: 'c1', type: 'cravings', goal: 1, icon: 'zap', label: '1 kriz', title: 'İlk kriz' },
  { id: 'c10', type: 'cravings', goal: 10, icon: 'zap', label: '10 kriz', title: '10 kriz' },
  { id: 'c50', type: 'cravings', goal: 50, icon: 'zap', label: '50 kriz', title: '50 kriz' },
];

export const BADGE_GROUPS = [
  { type: 'time', title: 'Süre Rozetleri', filter: 'Süre' },
  { type: 'money', title: 'Tasarruf Rozetleri', filter: 'Tasarruf' },
  { type: 'cravings', title: 'Kriz Rozetleri', filter: 'Kriz' },
];

export const TRIGGERS = ['Stres', 'Kahve', 'Alkol', 'Yemek sonrası', 'Sosyal ortam', 'Sıkılma', 'Diğer'];

export const TIPS = [
  'Bir bardak soğuk su iç, yudum yudum.',
  '10 dakika yürüyüşe çık.',
  'Bir arkadaşına mesaj at.',
  'Ellerini meşgul et: kalem çevir, stres topu sık.',
  'Sakız çiğne ya da havuç, salatalık gibi çıtır bir şey ye.',
  'Dişlerini fırçala; temiz ağız hissi isteği azaltır.',
  'Yüzünü soğuk suyla yıka.',
  'Bulunduğun yerden çık, başka bir odaya geç.',
  'Sevdiğin bir şarkıyı aç ve sonuna kadar dinle.',
  'Biriktirdiğin parayla ne alacağını düşün.',
  'İstek dalga gibidir: birkaç dakikada zirve yapıp geçer.',
];

// Bir sigaranın ömürden götürdüğü yaklaşık süre (BMJ, 2000).
export const LIFE_PER_CIGARETTE = 11 * MIN;

// Nefes döngüsü: 4 sn al, 4 sn tut, 6 sn ver.
export const BREATH = [
  { label: 'Nefes al', ms: 4000, scale: 1 },
  { label: 'Tut', ms: 4000, scale: 1 },
  { label: 'Nefes ver', ms: 6000, scale: 0.45 },
];
export const BREATH_TOTAL_MS = 60 * 1000;
