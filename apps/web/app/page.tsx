const foundationItems = [
  'Next.js + TypeScript strict',
  'واجهة عربية وRTL من الجذر',
  'اتصال الويب عبر Backend API فقط',
  'بنية جاهزة للتدويل والوضع الداكن',
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="card" aria-labelledby="foundation-title">
        <p className="eyebrow">NASAQ / نَسَق</p>
        <h1 id="foundation-title">المرحلة صفر: الأساس الهندسي</h1>
        <p className="lead">
          هذه واجهة تأسيسية فقط. وحدات المهام والمالية والديون والمشاريع لم تُبنَ بعد عمدًا.
        </p>
        <ul>
          {foundationItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
