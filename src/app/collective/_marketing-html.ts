// Auto-ported from the approved Collective marketing design. Scoped to .col.
export const MARKETING_HTML = String.raw`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  :root{
    --bg:#faf9f7; --bg2:#f2f0ec; --card:#ffffff; --line:#e5e2dc; --line2:#d6d3cc;
    --ink:#1a1816; --mut:#6b6762; --acc:#3b82f6; --acc2:#2563eb; --accsoft:#eff6ff; --accmut:#dbeafe;
    --brblue:#1B6DFC;
  }
  html{scroll-behavior:smooth;}
  .col{background:var(--bg);font-family:'Inter',-apple-system,sans-serif;color:var(--ink);}
  .mono{font-family:'JetBrains Mono',ui-monospace,monospace;}
  .wrap{width:1200px;max-width:100%;margin:0 auto;padding:0 64px;}
  .sec{padding:104px 0;}
  .sec.alt{background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
  .eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:var(--acc);letter-spacing:.04em;margin-bottom:18px;}
  h2{font-size:40px;line-height:1.1;letter-spacing:-.03em;font-weight:800;max-width:760px;}
  .lead{font-size:18px;line-height:1.62;color:var(--mut);max-width:680px;margin-top:20px;}
  .lead b{color:var(--ink);font-weight:600;}
  .acc{color:var(--acc);}

  /* dot grid bg */
  .col{background-image:radial-gradient(var(--line2) 1px, transparent 1px);background-size:26px 26px;background-position:-13px -13px;}
  .sec.alt{background-image:radial-gradient(var(--line2) 1px, transparent 1px);background-size:26px 26px;background-position:-13px -13px,0 0;background-color:var(--bg2);}

  /* nav */
  nav{position:sticky;top:0;z-index:50;background:rgba(250,249,247,.86);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);}
  .navin{display:flex;align-items:center;justify-content:space-between;padding:18px 64px;width:1200px;max-width:100%;margin:0 auto;}
  .logo{display:flex;align-items:center;gap:11px;}
  .logo .mk{width:34px;height:34px;border-radius:9px;background:var(--ink);color:#fff;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:16px;display:flex;align-items:center;justify-content:center;}
  .logo .nm{font-weight:700;letter-spacing:-.02em;font-size:16px;}
  .navlinks{display:flex;align-items:center;gap:30px;font-size:14px;color:var(--mut);font-weight:500;}
  .navlinks .pwr{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--mut);display:flex;align-items:center;gap:7px;}
  .navlinks .pwr i{width:6px;height:6px;border-radius:50%;background:var(--brblue);display:inline-block;}
  .navlinks .pwr b{color:var(--brblue);font-weight:600;}
  .btn{background:var(--ink);color:#fff;font-weight:600;font-size:14px;padding:11px 20px;border-radius:9px;text-decoration:none;}
  .btn.acc{background:var(--acc);box-shadow:0 8px 22px rgba(59,130,246,.28);}

  /* hero */
  .hero{display:grid;grid-template-columns:1.05fr .95fr;gap:54px;align-items:center;padding:80px 0 84px;}
  .hbadge{display:inline-flex;align-items:center;gap:9px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;color:var(--mut);
    background:var(--card);border:1px solid var(--line);border-radius:30px;padding:7px 14px;margin-bottom:26px;}
  .hbadge .dot{width:7px;height:7px;border-radius:50%;background:var(--brblue);box-shadow:0 0 0 3px rgba(27,109,252,.16);}
  h1{font-size:56px;line-height:1.04;letter-spacing:-.03em;font-weight:800;}
  h1 .a{color:var(--acc);}
  .hsub{font-size:17.5px;line-height:1.6;color:var(--mut);margin-top:24px;max-width:540px;}
  .hsub b{color:var(--ink);font-weight:600;}
  .cta{display:flex;align-items:center;gap:14px;margin-top:34px;}
  .cta .primary{background:var(--acc);color:#fff;font-weight:600;font-size:15px;padding:15px 26px;border-radius:11px;text-decoration:none;box-shadow:0 8px 22px rgba(59,130,246,.28);}
  .cta .ghost{color:var(--ink);font-weight:600;font-size:15px;padding:15px 8px;text-decoration:none;border-bottom:2px solid var(--line2);}
  .trust{margin-top:38px;display:flex;align-items:center;gap:16px;}
  .seats{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--mut);}
  .seats b{color:var(--ink);}
  .dots{display:flex;gap:5px;}
  .dots i{width:11px;height:11px;border-radius:50%;display:inline-block;background:var(--acc);}
  .dots i.open{background:transparent;border:1.5px solid var(--line2);}

  .frame{background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 30px 70px rgba(26,24,22,.12);overflow:hidden;}
  .bar{display:flex;align-items:center;gap:7px;padding:13px 16px;border-bottom:1px solid var(--line);background:var(--bg2);}
  .bar i{width:11px;height:11px;border-radius:50%;background:var(--line2);}
  .bar .url{margin-left:12px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--mut);background:var(--card);border:1px solid var(--line);border-radius:7px;padding:5px 12px;}
  .bar .pwrbadge{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--brblue);border:1px solid var(--accmut);background:var(--accsoft);border-radius:20px;padding:4px 9px;}
  .app{padding:20px;}
  .apptop{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
  .apptop .brand{display:flex;align-items:center;gap:9px;}
  .apptop .brand .blk{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#9b8cff,#6b5bd6);}
  .apptop .brand .t{font-weight:700;font-size:13px;}
  .apptop .who{font-size:10.5px;color:var(--mut);font-family:'JetBrains Mono',monospace;}
  .readcard{border:1px solid var(--line);border-radius:12px;padding:15px;margin-bottom:12px;}
  .readcard .h{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;}
  .readcard .h .lab{font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--acc);}
  .readcard .h .pill{font-size:9px;font-weight:600;color:#fff;background:var(--acc);padding:3px 8px;border-radius:20px;}
  .readcard .ln{height:8px;border-radius:5px;background:var(--bg2);margin-bottom:8px;}
  .readcard .ln.s1{width:92%;} .readcard .ln.s2{width:78%;} .readcard .ln.s3{width:85%;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .mini{border:1px solid var(--line);border-radius:11px;padding:13px;}
  .mini .lab{font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.8px;text-transform:uppercase;color:var(--mut);margin-bottom:9px;}
  .mini .big{font-size:22px;font-weight:800;letter-spacing:-.02em;}
  .mini .big span{font-size:12px;color:var(--mut);font-weight:600;}
  .bars{display:flex;align-items:flex-end;gap:5px;height:34px;margin-top:8px;}
  .bars i{flex:1;background:var(--accmut);border-radius:3px 3px 0 0;}
  .bars i.on{background:var(--acc);}

  /* problem cards */
  .three{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:46px;}
  .pcard{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px;}
  .pcard .n{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--acc);margin-bottom:14px;}
  .pcard h4{font-size:18px;font-weight:700;letter-spacing:-.01em;margin-bottom:9px;}
  .pcard p{font-size:14.5px;line-height:1.55;color:var(--mut);}

  /* offer split */
  .offergrid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:46px;}
  .obox{border-radius:16px;padding:30px;border:1px solid var(--line);}
  .obox.you{background:var(--card);}
  .obox.us{background:var(--ink);color:#fff;border-color:var(--ink);}
  .obox .lab{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:18px;}
  .obox.you .lab{color:var(--acc);}
  .obox.us .lab{color:#7fb0ff;}
  .obox ul{list-style:none;}
  .obox li{font-size:15px;line-height:1.5;padding-left:24px;position:relative;margin-bottom:14px;}
  .obox li:last-child{margin-bottom:0;}
  .obox.you li{color:var(--ink);}
  .obox.us li{color:#cbd2db;}
  .obox li::before{content:"";position:absolute;left:0;top:6px;width:8px;height:8px;border-radius:50%;background:var(--acc);}
  .offerline{margin-top:30px;font-size:20px;font-weight:700;letter-spacing:-.02em;}
  .offerline span{color:var(--acc);}

  /* feature grid */
  .fgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:48px;}
  .fcard{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;}
  .fcard .ic{width:36px;height:36px;border-radius:9px;background:var(--accsoft);border:1px solid var(--accmut);display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
  .fcard .ic span{width:14px;height:14px;border-radius:4px;background:var(--acc);}
  .fcard h4{font-size:15px;font-weight:700;margin-bottom:7px;letter-spacing:-.01em;}
  .fcard p{font-size:13px;line-height:1.5;color:var(--mut);}
  .mtag{display:inline-block;margin-top:13px;font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:20px;}
  .mtag.live{color:var(--acc);background:var(--accsoft);border:1px solid var(--accmut);}
  .mtag.next{color:var(--mut);background:var(--bg2);border:1px solid var(--line);}

  /* deliverables strip */
  .stackbar{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--card);}
  .stackin{width:1200px;max-width:100%;margin:0 auto;padding:20px 64px;display:flex;align-items:center;gap:22px;flex-wrap:wrap;}
  .stacklab{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;color:var(--mut);white-space:nowrap;}
  .stackchips{display:flex;flex-wrap:wrap;gap:8px;}
  .stackchips .sc{font-size:12.5px;font-weight:600;color:var(--ink);background:var(--bg2);border:1px solid var(--line);border-radius:30px;padding:6px 13px;}

  /* proof */
  .shots{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:46px;align-items:start;}
  .shot{}
  .shot .img{border-radius:14px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 40px rgba(26,24,22,.12);background:#fff;aspect-ratio:1080/860;}
  .shot .img img{width:100%;display:block;object-fit:cover;object-position:top center;}
  .shot .cap{margin-top:14px;display:flex;align-items:baseline;gap:8px;}
  .shot .cap .k{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--acc);}
  .shot .cap .t{font-size:14px;font-weight:600;color:var(--ink);}
  .shot .cap .t span{color:var(--mut);font-weight:400;}
  .proofstrip{margin-top:40px;display:flex;flex-wrap:wrap;gap:10px 28px;align-items:center;}
  .proofstrip .pi{font-family:'JetBrains Mono',monospace;font-size:12.5px;color:var(--mut);}
  .proofstrip .pi b{color:var(--ink);}
  .prooflink{margin-top:26px;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--acc);}
  .proofnote{margin-top:8px;font-size:12.5px;color:var(--mut);}

  /* steps */
  .steps{margin-top:48px;display:flex;flex-direction:column;gap:0;}
  .step{display:grid;grid-template-columns:64px 1fr;gap:24px;padding:24px 0;border-top:1px solid var(--line);}
  .step:last-child{border-bottom:1px solid var(--line);}
  .step .num{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:var(--acc);padding-top:3px;}
  .step h4{font-size:19px;font-weight:700;letter-spacing:-.02em;margin-bottom:6px;}
  .step p{font-size:15px;line-height:1.55;color:var(--mut);max-width:640px;}

  /* fit */
  .fitgrid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:46px;}
  .fitbox{border:1px solid var(--line);border-radius:16px;padding:28px;background:var(--card);}
  .fitbox.no{background:var(--bg2);}
  .fitbox .lab{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.04em;margin-bottom:18px;}
  .fitbox.yes .lab{color:var(--acc);}
  .fitbox.no .lab{color:var(--mut);}
  .fitbox ul{list-style:none;}
  .fitbox li{font-size:15px;line-height:1.5;padding-left:26px;position:relative;margin-bottom:13px;color:var(--ink);}
  .fitbox li:last-child{margin-bottom:0;}
  .fitbox.yes li::before{content:"\2713";position:absolute;left:0;top:0;color:var(--acc);font-weight:700;}
  .fitbox.no li{color:var(--mut);}
  .fitbox.no li::before{content:"\00d7";position:absolute;left:0;top:-1px;color:var(--line2);font-weight:700;font-size:18px;}

  /* founding terms */
  .terms{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:46px;}
  .term{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px;}
  .term .ic{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--acc);margin-bottom:14px;}
  .term h4{font-size:15px;font-weight:700;margin-bottom:7px;letter-spacing:-.01em;}
  .term p{font-size:13px;line-height:1.5;color:var(--mut);}
  .statband{display:grid;grid-template-columns:repeat(3,1fr);margin-top:40px;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--card);}
  .statband .st{padding:26px 24px;border-right:1px solid var(--line);}
  .statband .st:last-child{border-right:none;}
  .statband .st .num{font-size:38px;font-weight:800;letter-spacing:-.03em;color:var(--acc);line-height:1;}
  .statband .st .cap{font-size:13px;line-height:1.5;color:var(--ink);margin-top:13px;}
  .statband .st .src{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--mut);margin-top:11px;}
  .capwide{margin-top:40px;display:flex;align-items:center;gap:18px;background:var(--ink);color:#fff;border-radius:14px;padding:22px 28px;}
  .capwide .dots i{width:13px;height:13px;}
  .capwide .dots i.open{border-color:#3b4150;}
  .capwide .txt{font-family:'JetBrains Mono',monospace;font-size:13px;color:#cbd2db;}
  .capwide .txt b{color:#fff;}

  /* relationship layers */
  .layers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:46px;}
  .layer{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:26px;}
  .layer .step-n{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--mut);margin-bottom:12px;}
  .layer h4{font-size:17px;font-weight:700;margin-bottom:8px;letter-spacing:-.01em;}
  .layer p{font-size:14px;line-height:1.55;color:var(--mut);}
  .winline{margin-top:30px;font-size:15px;color:var(--mut);font-family:'JetBrains Mono',monospace;}

  /* founder */
  .founder{display:grid;grid-template-columns:1fr 1.4fr;gap:48px;align-items:start;margin-top:10px;}
  .fcardbig{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:30px;}
  .fcardbig .nm{font-size:20px;font-weight:800;letter-spacing:-.02em;}
  .fcardbig .role{font-size:13px;color:var(--mut);margin-top:4px;margin-bottom:18px;font-family:'JetBrains Mono',monospace;}
  .chips{display:flex;flex-wrap:wrap;gap:8px;}
  .chip{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--mut);background:var(--bg2);border:1px solid var(--line);border-radius:20px;padding:6px 11px;}
  .fstory p{font-size:17px;line-height:1.66;color:var(--ink);margin-bottom:18px;}
  .fstory p.m{color:var(--mut);font-size:16px;}

  /* faq */
  .faq{margin-top:46px;border-top:1px solid var(--line);}
  .qa{padding:24px 0;border-bottom:1px solid var(--line);display:grid;grid-template-columns:340px 1fr;gap:32px;}
  .qa h4{font-size:17px;font-weight:700;letter-spacing:-.01em;}
  .qa p{font-size:15px;line-height:1.6;color:var(--mut);}

  /* final cta */
  .final{text-align:center;background:var(--ink);color:#fff;border-radius:24px;padding:72px 40px;position:relative;overflow:hidden;}
  .final .glow{position:absolute;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,.32) 0%,rgba(59,130,246,0) 68%);top:-180px;left:50%;transform:translateX(-50%);}
  .final h2{font-size:42px;margin:0 auto;color:#fff;position:relative;letter-spacing:-.03em;}
  .final p{font-size:17px;color:#aeb6c1;margin:18px auto 0;max-width:540px;line-height:1.6;position:relative;}
  .final .primary{display:inline-block;margin-top:32px;background:var(--acc);color:#fff;font-weight:600;font-size:16px;padding:16px 30px;border-radius:12px;text-decoration:none;position:relative;box-shadow:0 12px 30px rgba(59,130,246,.4);}
  .final .seats{margin-top:18px;color:#8a93a0;position:relative;}

  footer{padding:40px 0 60px;}
  .foot{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--line);padding-top:26px;}
  .foot .l{display:flex;align-items:center;gap:11px;}
  .foot .l .mk{width:28px;height:28px;border-radius:7px;background:var(--ink);color:#fff;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;}
  .foot .meta{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--mut);}
  .foot .meta b{color:var(--brblue);}
  .col{min-height:100vh;}
</style>
<div class="col">

<!-- NAV -->
<nav>
  <div class="navin">
    <div class="logo"><div class="mk">BR</div><div class="nm">Body Recode</div></div>
    <div class="navlinks">
      <span class="pwr"><i></i><b>The&nbsp;Collective</b></span>
      <a class="btn acc" href="/collective/apply">Apply to join</a>
    </div>
  </div>
</nav>

<!-- HERO -->
<div class="wrap">
  <section class="hero">
    <div>
      <div class="hbadge"><span class="dot"></span><span class="mono">The Body Recode Collective</span></div>
      <h1>You coach.<br>The platform<br>does <span class="a">the rest.</span></h1>
      <p class="hsub">A collective of coaches practising to one standard. You get a branded coaching platform — <b>scorecard funnel</b>, <b>AI client readings</b>, programming, nutrition and payments — all powered by the Body Recode engine. You bring the practice; we bring the system.</p>
      <div class="cta">
        <a class="primary" href="/collective/apply">Apply to join the Collective &rarr;</a>
        <a class="ghost" href="#inside">See what you get</a>
      </div>
      <div class="trust">
        <div class="dots"><i></i><i></i><i></i><i class="open"></i><i class="open"></i><i class="open"></i><i class="open"></i><i class="open"></i><i class="open"></i><i class="open"></i></div>
        <div class="seats"><b>3 founding members</b> admitted &middot; applications open</div>
      </div>
    </div>
    <div class="frame">
      <div class="bar"><i></i><i></i><i></i><span class="url">app.yourbrand.com</span><span class="pwrbadge">powered by Body Recode</span></div>
      <div class="app">
        <div class="apptop">
          <div class="brand"><div class="blk"></div><div class="t">Your Studio</div></div>
          <div class="who">Sarah M · Wk 6</div>
        </div>
        <div class="readcard">
          <div class="h"><span class="lab">AI Client Reading</span><span class="pill">New</span></div>
          <div class="ln s1"></div><div class="ln s2"></div><div class="ln s3"></div>
        </div>
        <div class="grid2">
          <div class="mini"><div class="lab">Active clients</div><div class="big">18<span> / 20</span></div>
            <div class="bars"><i style="height:40%"></i><i style="height:55%"></i><i class="on" style="height:70%"></i><i style="height:50%"></i><i class="on" style="height:85%"></i><i class="on" style="height:75%"></i><i style="height:60%"></i><i class="on" style="height:95%"></i></div></div>
          <div class="mini"><div class="lab">MRR</div><div class="big">$3.6k</div>
            <div class="bars"><i style="height:45%"></i><i class="on" style="height:60%"></i><i style="height:50%"></i><i class="on" style="height:72%"></i><i style="height:58%"></i><i class="on" style="height:80%"></i><i class="on" style="height:88%"></i><i class="on" style="height:96%"></i></div></div>
        </div>
      </div>
    </div>
  </section>
</div>

<!-- DELIVERABLES STRIP -->
<div class="stackbar">
  <div class="stackin">
    <span class="stacklab">Everything your practice runs on, in one stack</span>
    <div class="stackchips">
      <span class="sc">Branded site</span>
      <span class="sc">Scorecard funnel</span>
      <span class="sc">AI client readings</span>
      <span class="sc">Programming</span>
      <span class="sc">Nutrition</span>
      <span class="sc">Client portal</span>
      <span class="sc">Payments</span>
      <span class="sc">Email &amp; automation</span>
    </div>
  </div>
</div>

<!-- PROBLEM -->
<section class="sec alt">
  <div class="wrap">
    <div class="eyebrow">// The problem</div>
    <h2>You are great at your craft. The business around it is held together with tape.</h2>
    <p class="lead">Most practitioners run on a pile of tools that do not talk. A page here, a booking link there, a spreadsheet, a payment link, an inbox. None of it reads your clients, and none of it is really yours.</p>
    <div class="three">
      <div class="pcard"><div class="n">01</div><h4>Generic by design</h4><p>Off-the-shelf platforms make you look like everyone else and box you into their workflow, not yours.</p></div>
      <div class="pcard"><div class="n">02</div><h4>Nothing interprets</h4><p>Your tools store data. They never read it, or tell you what a specific client actually needs next.</p></div>
      <div class="pcard"><div class="n">03</div><h4>You are the system</h4><p>Every report, check-in and follow-up runs through you by hand. Growth means more hours, not more leverage.</p></div>
    </div>
  </div>
</section>

<!-- OFFER -->
<section class="sec">
  <div class="wrap">
    <div class="eyebrow">// The offer</div>
    <h2>Your own platform. Powered by a proven engine.</h2>
    <p class="lead">Instead of a blank build or a template, you get a branded instance of the engine that runs Body Recode, a working coaching practice. We set it up for your modality, put your brand on it, and stand it up.</p>
    <div class="offergrid">
      <div class="obox you">
        <div class="lab">You bring</div>
        <ul>
          <li>Your method, the way you actually work</li>
          <li>Your brand and your audience</li>
          <li>The coaching itself, the human part</li>
        </ul>
      </div>
      <div class="obox us">
        <div class="lab">We bring</div>
        <ul>
          <li>The interpretive engine and AI readings</li>
          <li>The scorecard funnel, portal, payments and automation</li>
          <li>The build, the hosting, and every upgrade we ship</li>
        </ul>
      </div>
    </div>
    <p class="offerline">Not software you have to learn. <span>A business you step into.</span></p>
  </div>
</section>

<!-- WHAT YOU GET -->
<section class="sec alt" id="inside">
  <div class="wrap">
    <div class="eyebrow">// What it takes off your plate</div>
    <h2>The whole operation, run for you.</h2>
    <div class="fgrid">
      <div class="fcard"><div class="ic"><span></span></div><h4>Branded site</h4><p>A fast site that looks like you. No Wix, no template, no web designer to chase.</p></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>Scorecard funnel</h4><p>A quiz that segments leads and fires a personalised report. No more dead PDF lead magnets.</p></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>AI client readings</h4><p>The engine reads each client and tells you what they need next. No more staring at a spreadsheet.</p></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>Programming</h4><p>Plans, baselines and progressions, drafted for you to approve. No rebuilding every block from scratch.</p></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>Nutrition</h4><p>Plans drafted to your guidance, inside the safety floors. No manual macro maths.</p></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>Client portal</h4><p>Logins, check-ins, progress and readings, branded to you. No more juggling five apps.</p></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>Payments</h4><p>Stripe subscriptions and one-off products, handled. No more chasing invoices.</p></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>Email &amp; automation</h4><p>Nurture sequences and reminders that run while you coach. No inbox to babysit.</p></div>
    </div>
  </div>
</section>

<!-- MODALITY -->
<section class="sec" id="modality">
  <div class="wrap">
    <div class="eyebrow">// Built for your modality</div>
    <h2>Not a strength template with the words swapped out.</h2>
    <p class="lead">The engine generates programming that is native to how <b>you</b> coach. A strength coach gets blocks, loads and RPE. A yoga teacher gets sequences, holds and intensity matched to each client's state, with contraindications screened out automatically. Same engine, a different brain for each modality, so the platform never feels borrowed.</p>
    <div class="fgrid">
      <div class="fcard"><div class="ic"><span></span></div><h4>Strength</h4><p>Blocks, loads, RPE and progressions. The original Body Recode engine.</p><span class="mtag live">Live</span></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>Yoga</h4><p>Sequences, holds, intensity by client state, contraindication screening.</p><span class="mtag live">Live</span></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>Pilates</h4><p>The next modality pack, in build on the same framework.</p><span class="mtag next">Next</span></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>Your modality</h4><p>Mobility, rehab, allied health. The framework is built to take on more.</p><span class="mtag next">On request</span></div>
    </div>
  </div>
</section>

<!-- YOURS TO STEER -->
<section class="sec" id="yours">
  <div class="wrap">
    <div class="eyebrow">// Whose coaching is it</div>
    <h2>You run on a proven engine. It still answers to you.</h2>
    <p class="lead">You are not bringing your own software to plug in. You get a white-labelled instance of the engine that already runs Body Recode: the scorecard logic, the readings, the state model, the programming and nutrition doctrine, the safety floors. What keeps it <b>yours</b>, and not borrowed, is where your coaching drives it.</p>
    <div class="fgrid">
      <div class="fcard"><div class="ic"><span></span></div><h4>Your modality</h4><p>A yoga teacher runs the yoga brain, not strength with the words swapped. Native to how you work.</p></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>You edit or veto</h4><p>Nothing reaches a client without your approval. Every reading, plan and block is yours to change or kill.</p></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>You steer it</h4><p>Guidance fields and manual design let you direct the engine, or hand-write a program yourself.</p></div>
      <div class="fcard"><div class="ic"><span></span></div><h4>Your brand, your people</h4><p>Brand, voice, audience and client relationships are entirely yours. You can leave with all of it.</p></div>
    </div>
    <p class="offerline" style="margin-top:38px;">Yours to brand, steer and veto. <span>Your own method gets woven in deeper over time.</span></p>
  </div>
</section>

<!-- WHY A SCORECARD -->
<section class="sec" id="whyscorecard">
  <div class="wrap">
    <div class="eyebrow">// Why a scorecard</div>
    <h2>Nobody reads your ebook. They will rate themselves.</h2>
    <p class="lead">The free PDF is dead. People do not want another guide to skim and forget. They want to know about <b>themselves</b>. A scorecard hands them a personalised result in two minutes, and hands you a qualified, segmented lead in return. It is a two-way exchange, not a one-way giveaway.</p>
    <div class="statband">
      <div class="st"><div class="num">44.9%</div><div class="cap">of people who start a coaching scorecard become a lead. A typical PDF opt-in sits at 3 to 10 percent.</div><div class="src">// Interact, across 80M+ leads</div></div>
      <div class="st"><div class="num">91%</div><div class="cap">of buyers now prefer interactive content over static downloads.</div><div class="src">// Demand Gen Report</div></div>
      <div class="st"><div class="num">~2x</div><div class="cap">Interactive content converts about twice as well as passive content.</div><div class="src">// Demand Metric</div></div>
    </div>
    <div class="fitgrid">
      <div class="fitbox no">
        <div class="lab">The old lead magnet</div>
        <ul>
          <li>Downloaded once, then never opened</li>
          <li>You get an email address and nothing else</li>
          <li>The same generic PDF for everyone</li>
          <li>No idea who is actually ready to buy</li>
        </ul>
      </div>
      <div class="fitbox yes">
        <div class="lab">The scorecard</div>
        <ul>
          <li>Finished, because it is about them</li>
          <li>You learn their state, their struggle, their readiness</li>
          <li>A different, personalised result for every person</li>
          <li>You know exactly who to call first</li>
        </ul>
      </div>
    </div>
    <p class="lead" style="margin-top:30px;">And this is not a concept. The scorecard funnel below runs Body Recode today, not a mockup: a free 2-minute quiz that turns a stranger into a qualified lead and a personalised body-state report the moment they finish. Your branded version runs the same funnel, with your name on it.</p>
    <div class="shots">
      <div class="shot">
        <div class="img"><img src="/collective/br_scorecard.png" alt="Body Recode scorecard quiz"></div>
        <div class="cap"><span class="k">step 1</span><span class="t">The scorecard <span>· the 2-minute quiz they take</span></span></div>
      </div>
      <div class="shot">
        <div class="img"><img src="/collective/br_reading.png" alt="Body Recode scorecard report"></div>
        <div class="cap"><span class="k">step 2</span><span class="t">The report <span>· generated the moment they finish</span></span></div>
      </div>
      <div class="shot">
        <div class="img"><img src="/collective/br_scoring.png" alt="Body Recode scorecard section scores"></div>
        <div class="cap"><span class="k">step 3</span><span class="t">The scoring <span>· segmented across six systems</span></span></div>
      </div>
    </div>
    <p class="prooflink">// take it yourself at performance.bodyrecode.au/scorecard</p>
    <p class="proofnote">The scorecard is only the front door. The same platform runs the full client engine behind it: foundational, program and nutrition readings, check-ins and payments.</p>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="sec alt">
  <div class="wrap">
    <div class="eyebrow">// How it works</div>
    <h2>From signed to live, in weeks.</h2>
    <div class="steps">
      <div class="step"><div class="num">01</div><div><h4>Apply</h4><p>A short application and a call. Membership is by application, not open enrolment &mdash; we make sure you are a fit.</p></div></div>
      <div class="step"><div class="num">02</div><div><h4>Your setup pack</h4><p>You fill in one simple pack &mdash; your brand, domain, prices and modality &mdash; and we get you fluent in the platform. Everything downstream is built from it, and anything you are missing starts on a smart default.</p></div></div>
      <div class="step"><div class="num">03</div><div><h4>Build sprint</h4><p>We brand it, configure it, and stand up your site, funnel and platform.</p></div></div>
      <div class="step"><div class="num">04</div><div><h4>Launch</h4><p>Your scorecard goes live to your audience. Your first clients come in.</p></div></div>
      <div class="step"><div class="num">05</div><div><h4>Run and grow</h4><p>We host, maintain and improve it. You inherit every upgrade we ship, automatically.</p></div></div>
    </div>
  </div>
</section>

<!-- GROWTH / FUNNEL ADD-ON -->
<section class="sec" id="growth">
  <div class="wrap">
    <div class="eyebrow">// Growth, when you're ready</div>
    <h2>When you want to scale, we build the funnels too.</h2>
    <p class="lead">Once you are live and the scorecard is filling your pipeline, the next move is converting and scaling. We build you the same funnels that run Body Recode, re-skinned to your brand and your offer. It is an <b>optional add-on, not part of the base</b>, so you take it on when the timing is right.</p>
    <div class="offergrid">
      <div class="obox you">
        <div class="lab">Conversion Funnel</div>
        <p style="font-size:15px;line-height:1.55;color:var(--ink);">Scorecard to a paid ladder. The proven funnel that turns a free result into a paying client, set up end to end for you.</p>
      </div>
      <div class="obox you">
        <div class="lab">Challenge Funnel</div>
        <p style="font-size:15px;line-height:1.55;color:var(--ink);">A free challenge into a paid blueprint. The same campaign mechanics we run at Body Recode, built around your audience.</p>
      </div>
    </div>
    <p class="winline">// an optional add-on once you're live, priced per build, done-with-you or fully done-for-you</p>
  </div>
</section>

<!-- FIT -->
<section class="sec">
  <div class="wrap">
    <div class="eyebrow">// Fit</div>
    <h2>Built for practitioners with a method and an audience.</h2>
    <div class="fitgrid">
      <div class="fitbox yes">
        <div class="lab">This is for you if</div>
        <ul>
          <li>You are a coach or allied-health practitioner who gets results</li>
          <li>You have a way of working that is genuinely yours</li>
          <li>You have, or are building, an audience that trusts you</li>
          <li>You would rather own a business than rent a tool</li>
          <li>You value your time over doing it all yourself</li>
        </ul>
      </div>
      <div class="fitbox no">
        <div class="lab">This is not for you if</div>
        <ul>
          <li>You have no method yet and want us to invent one</li>
          <li>You are shopping purely on price</li>
          <li>You want to manage every pixel and dictate the build</li>
          <li>You are not ready to put your name on something real</li>
          <li>You need it live next week</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- FOUNDING TEN -->
<section class="sec alt">
  <div class="wrap">
    <div class="eyebrow">// The Collective</div>
    <h2>A collective of coaches practising to one standard.</h2>
    <p class="lead">This is not open enrolment. Coaches are <b>admitted, not signed up</b> — every member runs the same engine and the same standard, which is what keeps the standard high. The founding cohort gets the best terms I will ever offer, in exchange for helping shape the platform.</p>
    <div class="terms">
      <div class="term"><div class="ic">01</div><h4>Founding pricing, locked</h4><p>Your founding rate is locked for as long as you stay.</p></div>
      <div class="term"><div class="ic">02</div><h4>Input into the roadmap</h4><p>What you need shapes what gets built next.</p></div>
      <div class="term"><div class="ic">03</div><h4>First access</h4><p>Every new feature reaches you before anyone else.</p></div>
      <div class="term"><div class="ic">04</div><h4>Founding status</h4><p>Recognition as a founding member, and co-marketing.</p></div>
    </div>
    <div class="capwide">
      <div class="dots"><i></i><i></i><i></i><i class="open"></i><i class="open"></i><i class="open"></i><i class="open"></i><i class="open"></i><i class="open"></i><i class="open"></i></div>
      <div class="txt">The <b>founding cohort</b> is limited. When it fills, founding terms close and later members join at standard rates.</div>
    </div>
  </div>
</section>

<!-- RELATIONSHIP -->
<section class="sec">
  <div class="wrap">
    <div class="eyebrow">// How the relationship works</div>
    <h2>We only win when you win.</h2>
    <p class="lead">You are not buying a licence and getting left alone. The model is built so our incentives line up. When you sign more clients, we both do better.</p>
    <div class="layers">
      <div class="layer"><div class="step-n">Build it</div><h4>Setup</h4><p>A one-time fee to configure, build and brand your platform, and stand it up.</p></div>
      <div class="layer"><div class="step-n">Run it</div><h4>Membership</h4><p>A monthly membership for hosting, support and every upgrade we ship. It ramps up as you build, so you get runway before the full rate.</p></div>
      <div class="layer"><div class="step-n">Power it</div><h4>Per active client</h4><p>A small share of what each active client pays you, so the cost scales with your pricing and only grows as your practice does.</p></div>
    </div>
    <p class="winline">// exact numbers depend on your starting point, and we walk through them on the call</p>
  </div>
</section>

<!-- FOUNDER -->
<section class="sec alt">
  <div class="wrap">
    <div class="eyebrow">// Who is behind it</div>
    <h2>Built by an operator, not an agency.</h2>
    <div class="founder">
      <div class="fcardbig">
        <div class="nm">Kade Dunstone</div>
        <div class="role">Founder · Body Recode</div>
        <div class="chips">
          <span class="chip">Built &amp; runs Body Recode</span>
          <span class="chip">Live scorecard funnel</span>
          <span class="chip">Real paying clients</span>
          <span class="chip">AI client readings</span>
          <span class="chip">Programming &amp; nutrition engine</span>
          <span class="chip">Portal &amp; payments</span>
          <span class="chip">Solo operator, no agency</span>
        </div>
      </div>
      <div class="fstory">
        <p>I started as a performance coach. Body Recode is my main game. I needed a platform to run it on, could not afford an agency, and the off-the-shelf tools were not fit for purpose. So I built it myself, properly.</p>
        <p class="m">The Body Recode Collective is how I give that same system to other coaches, and stay close enough to every one of them to do it well. No team, no account managers, no outsourcing. You deal with the person actually building it.</p>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="sec">
  <div class="wrap">
    <div class="eyebrow">// Questions</div>
    <h2>The honest answers.</h2>
    <div class="faq">
      <div class="qa"><h4>Do I own everything?</h4><p>You own your brand, your website, your client relationships and your data. You license the engine that powers the platform, the same way you license any software your business runs on. You can leave anytime and keep your brand, clients and data.</p></div>
      <div class="qa"><h4>Do I need to be technical?</h4><p>No. You bring the coaching. We handle every piece of the build and keep it running.</p></div>
      <div class="qa"><h4>What does "powered by Body Recode" mean?</h4><p>The interpretive engine, the AI readings, the scorecard logic and the platform are built and maintained by us. Your brand sits on top. The attribution stays subtle.</p></div>
      <div class="qa"><h4>Does this only work for strength coaches?</h4><p>No. The engine runs strength and yoga today, each with its own native programming logic, not a relabelled template. Pilates is the next pack in build, and the framework is designed to take on new modalities. If you coach movement and have a method, there is a path.</p></div>
      <div class="qa"><h4>Are the marketing funnels included?</h4><p>The base build is the platform and your scorecard front door. Full conversion and challenge funnels, the same ones that run Body Recode, are an optional add-on we build once you are live and ready to scale. Priced per build, done-with-you or fully done-for-you.</p></div>
      <div class="qa"><h4>What if I already have a site or clients?</h4><p>We bring them across. Migration from your current tools is part of onboarding.</p></div>
      <div class="qa"><h4>How selective is it?</h4><p>Coaches are admitted by application, not sign-up — because every member practises to the same standard and I stay close to each one. It grows over time, but it stays curated. The standard is the point.</p></div>
    </div>
  </div>
</section>

<!-- FINAL CTA -->
<section class="sec" id="apply">
  <div class="wrap">
    <div class="final">
      <div class="glow"></div>
      <h2>A place in the Collective.</h2>
      <p>If you have a method that works and people who trust you, this is the missing piece. Apply and let us see if you are a fit.</p>
      <a class="primary" href="/collective/apply">Apply to join the Collective &rarr;</a>
      <div class="seats mono">Founding cohort &middot; applications open</div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="wrap">
    <div class="foot">
      <div class="l"><div class="mk">BR</div><div class="mono" style="font-size:13px;color:var(--mut);">Body Recode</div></div>
      <div class="meta">Brisbane, Australia · The <b>Body Recode</b> Collective · 2026</div>
    </div>
  </div>
</footer>

</div>
`
