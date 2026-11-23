# Quit — Sigarayı Bırak

Sigarayı bırakma yolculuğunda yanında olan, telefona eklenebilen bir web uygulaması (PWA).

- **Sayaç ve tasarruf:** sigarasız geçen süre, içilmeyen sigara, biriken para, geri kazanılan ömür
- **Sağlık kilometre taşları:** 20 dakikadan 15 yıla vücuttaki iyileşmeler (WHO / ACS)
- **Kriz anı:** 60 sn nefes egzersizi (4-4-6), dikkat dağıtıcı öneriler, istek günlüğü
- **Rozetler:** süre, tasarruf ve atlatılan kriz rozetleri; kutlama ekranı ve bildirimler
- **Kayma:** "İçtim" sayaç, tasarruf ve rozetleri sıfırlar; günlük korunur, yanlış basışta geri alınabilir

Hesap ya da sunucu yok; tüm veriler tarayıcıda (`localStorage`) saklanır. Ayarlar'dan JSON olarak yedeklenebilir.

## Çalıştırma

Derleme adımı yok. Klasörü herhangi bir statik sunucuyla açman yeterli:

```bash
python3 -m http.server 5173
```

Ardından `http://localhost:5173` adresini aç. GitHub Pages'te de olduğu gibi yayınlanabilir.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Ekranlar, ikon seti (SVG sprite), illüstrasyon |
| `styles.css` | Tasarım token'ları (en üstte) ve bileşen stilleri |
| `app.js` | Uygulama mantığı |
| `data.js` | Kilometre taşları, rozetler, öneriler |
| `sw.js` | Çevrimdışı çalışma ve bildirim tıklamaları |

## Bildirimler hakkında

Bildirimler rozet ya da kilometre taşı kazanıldığında uygulama açıkken veya arka plandayken gösterilir. Uygulama tamamen kapalıyken zamanlanmış bildirim göndermek bir push sunucusu gerektirir; şu an yok. iPhone'da bildirimler için uygulamanın önce "Ana Ekrana Ekle" ile yüklenmesi gerekir.
