import Converter from "./Converter";

export default function Page() {
  return (
    <main className="wrap">
      <h1>PDF → JPEG dönüştürücü</h1>
      <p className="sub">
        Her sayfayı otomatik olarak belirlediğin boyut altına sıkıştırır.
        Tüm işlem tarayıcında yapılır, dosyalar sunucuya yüklenmez.
      </p>
      <Converter />

      <style>{`
        .wrap {
          max-width: 880px;
          margin: 40px auto;
          padding: 0 20px;
        }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 14px; margin-bottom: 24px; }
      `}</style>
    </main>
  );
}
